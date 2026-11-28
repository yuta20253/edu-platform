package user

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue"
	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue/worker"
	"github.com/yuta20253/edu-platform/go/internal/shared/transaction/gormtx"
	"github.com/yuta20253/edu-platform/go/internal/user/application"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure/mail"
)

const integrationTimeout = 10 * time.Second

// recordedMail は recordingSender が受け取ったメールです。
type recordedMail struct {
	to, subject, body string
}

// recordingSender は送信されたメールを記録する mail.Sender です（メール送信のスタブ）。
type recordingSender struct {
	mu    sync.Mutex
	mails []recordedMail
}

func (s *recordingSender) Send(_ context.Context, to, subject, body string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.mails = append(s.mails, recordedMail{to: to, subject: subject, body: body})

	return nil
}

func (s *recordingSender) sent() []recordedMail {
	s.mu.Lock()
	defer s.mu.Unlock()

	return append([]recordedMail(nil), s.mails...)
}

// newRecordingContext は NewContext と同じ組み立てで、送信先だけを記録用の Sender にした Context を返します。
func newRecordingContext(
	db *gorm.DB,
	tokens TokenIssuer,
	codes SchoolCodeReader,
) (*Context, *recordingSender) {
	sender := &recordingSender{}
	svc := application.NewService(db, discardLogger(), worker.NewPublisher(db), tokens, codes,
		mail.NewInvitationMailer("https://front.example.com", sender))

	return &Context{svc: svc}, sender
}

func usersAndJobs(t *testing.T, db *gorm.DB) (int64, int64) {
	t.Helper()

	return countRows(t, db, "SELECT COUNT(*) FROM users"),
		countRows(t, db, "SELECT COUNT(*) FROM jobs WHERE type = ?", InvitationEmailJobType)
}

type consistencyCase struct {
	name      string
	create    func(ctx context.Context, c *Context, refs testRefs) error
	fnErr     error
	wantUsers int64
	wantJobs  int64
}

func consistencyCases() []consistencyCase {
	errBoom := errors.New("boom")
	student := func(ctx context.Context, c *Context, refs testRefs) error {
		_, err := c.CreateStudentAccount(ctx, CreateStudentAccountInput{Name: "生徒", NameKana: "セイト",
			Email: "s@example.com", HighSchoolID: refs.highSchoolA, GradeID: refs.gradeA1})

		return err
	}
	admin := func(ctx context.Context, c *Context, _ testRefs) error {
		_, err := c.CreateAdminAccount(ctx, CreateAdminAccountInput{Email: "a@example.com"})

		return err
	}
	teacher := func(ctx context.Context, c *Context, refs testRefs) error {
		_, err := c.CreateTeacherAccount(ctx, CreateTeacherAccountInput{Name: "教員", NameKana: "キョウイン",
			Email: "t@example.com", HighSchoolID: refs.highSchoolA,
			PendingInvitation: ptr(false), SendInvitationEmail: ptr(true)})

		return err
	}

	return []consistencyCase{
		{"生徒の作成をコミットするとアカウントと依頼が残る", student, nil, 2, 1},
		{"生徒の作成をロールバックするとどちらも残らない", student, errBoom, 1, 0},
		{"教員の作成をロールバックするとどちらも残らない", teacher, errBoom, 1, 0},
		{"管理者の作成をコミットするとアカウントと依頼が残る", admin, nil, 2, 1},
		{"メール重複で失敗するとどちらも残らない", func(ctx context.Context, c *Context, _ testRefs) error {
			_, err := c.CreateAdminAccount(ctx, CreateAdminAccountInput{Email: "USED@example.com"})
			if !IsEmailAlreadyUsed(err) {
				return fmt.Errorf("want email の taken, got %w", err)
			}

			return err
		}, nil, 1, 0},
	}
}

func TestIntegration_CreateAndEnqueueConsistency(t *testing.T) {
	for _, tt := range consistencyCases() {
		t.Run(tt.name, func(t *testing.T) {
			db, refs := setupTestDB(t)
			tokens, codes := newStubs(refs)
			c := NewContext(db, discardLogger(), tokens, codes, "https://front.example.com")
			mustInsertUser(t, db, userSeed{email: "used@example.com", roleID: refs.roleIDs[0]})

			err := gormtx.RunInTx(t.Context(), db, func(ctx context.Context, _ *gorm.DB) error {
				if err := tt.create(ctx, c, refs); err != nil {
					return err
				}

				return tt.fnErr
			})
			if tt.fnErr != nil && !errors.Is(err, tt.fnErr) {
				t.Fatalf("RunInTx() error = %v, want %v", err, tt.fnErr)
			}

			if tt.fnErr == nil && tt.wantJobs == 1 && err != nil {
				t.Fatalf("RunInTx() error = %v, want nil", err)
			}

			if users, jobs := usersAndJobs(t, db); users != tt.wantUsers || jobs != tt.wantJobs {
				t.Errorf("users=%d jobs=%d, want users=%d jobs=%d", users, jobs, tt.wantUsers, tt.wantJobs)
			}
		})
	}
}

// runWorkerUntil はワーカーを動かし、user_invitation_email のジョブがすべて終了状態になるまで待ちます。
func runWorkerUntil(t *testing.T, db *gorm.DB, handlers jobqueue.HandlerMap) {
	t.Helper()

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})

	go func() {
		defer close(done)
		worker.NewWorker(db, discardLogger(), handlers).Run(ctx, 20*time.Millisecond)
	}()

	defer func() {
		cancel()
		<-done
	}()

	deadline := time.Now().Add(integrationTimeout)
	for countRows(t, db, "SELECT COUNT(*) FROM jobs WHERE type = ? AND status NOT IN (?, ?)",
		InvitationEmailJobType, worker.StatusCompleted, worker.StatusFailed) > 0 {
		if time.Now().After(deadline) {
			t.Fatalf("招待メールのジョブが終了しませんでした")
		}

		time.Sleep(20 * time.Millisecond)
	}
}

func TestIntegration_JobExecution(t *testing.T) {
	db, refs := setupTestDB(t)
	tokens, codes := newStubs(refs)
	c, sender := newRecordingContext(db, tokens, codes)
	ctx := t.Context()

	// 管理者経路の教員（招待待ちでない・送信あり）
	teacher, err := c.CreateTeacherAccount(ctx, CreateTeacherAccountInput{
		Name: "教員", NameKana: "キョウイン", Email: "t@example.com", HighSchoolID: refs.highSchoolA,
		PendingInvitation: ptr(false), SendInvitationEmail: ptr(true)})
	if err != nil {
		t.Fatalf("CreateTeacherAccount() error = %v", err)
	}

	// 依頼後に無効化されたユーザー
	old := mustInsertUser(t, db, userSeed{email: "old@example.com", roleID: refs.roleIDs[2],
		deactivated: true})
	if _, err := c.RequestInvitationEmail(ctx, old, DeliveryEnqueue); err != nil {
		t.Fatalf("RequestInvitationEmail() error = %v", err)
	}

	runWorkerUntil(t, db, jobqueue.HandlerMap{InvitationEmailJobType: c.InvitationEmailHandler()})

	completed := countRows(t, db, "SELECT COUNT(*) FROM jobs WHERE type = ? AND status = ?",
		InvitationEmailJobType, worker.StatusCompleted)
	if completed != 2 {
		t.Errorf("completed = %d, want 2（送信成功と送信対象外はいずれも完了）", completed)
	}

	mails := sender.sent()
	wantLink := "https://front.example.com/password/reset/raw-token?email=t@example.com"

	if len(mails) != 1 || mails[0].to != "t@example.com" || mails[0].subject != "edu platform へのご招待" ||
		!strings.Contains(mails[0].body, wantLink) {
		t.Errorf("送信したメール = %+v, want 招待待ちでない教員への招待メール1件（無効化済みは送らない）", mails)
	}

	if tokens.issuedCount() != 1 || tokens.issued[0] != teacher.ID {
		t.Errorf("トークンの発行 = %v, want [%d]", tokens.issued, teacher.ID)
	}
}

func TestIntegration_JobRetryUntilFailed(t *testing.T) {
	db, refs := setupTestDB(t)
	tokens, codes := newStubs(refs)
	tokens.err = errors.New("token service down")
	c := NewContext(db, discardLogger(), tokens, codes, "https://front.example.com")

	id := mustInsertUser(t, db, userSeed{email: "t@example.com", roleID: refs.roleIDs[2]})
	if _, err := c.RequestInvitationEmail(t.Context(), id, DeliveryEnqueue); err != nil {
		t.Fatalf("RequestInvitationEmail() error = %v", err)
	}

	runWorkerUntil(t, db, jobqueue.HandlerMap{InvitationEmailJobType: c.InvitationEmailHandler()})

	var job worker.Job
	if err := db.Where("type = ?", InvitationEmailJobType).First(&job).Error; err != nil {
		t.Fatalf("ジョブの取得に失敗しました: %v", err)
	}

	if job.Status != worker.StatusFailed || job.Attempts != job.MaxAttempts ||
		tokens.issuedCount() != job.MaxAttempts {
		t.Errorf("job = {Status:%q Attempts:%d MaxAttempts:%d} 発行回数=%d, "+
			"want failed・試行回数が上限・試行ごとにトークンを発行", job.Status, job.Attempts,
			job.MaxAttempts, tokens.issuedCount())
	}
}

func TestIntegration_ImmediateResults(t *testing.T) {
	db, refs := setupTestDB(t)
	tokens, codes := newStubs(refs)
	c, sender := newRecordingContext(db, tokens, codes)
	ctx := t.Context()

	admin, err := c.CreateAdminAccount(ctx,
		CreateAdminAccountInput{Name: "管理者", Email: "a@example.com"})
	if err != nil {
		t.Fatalf("CreateAdminAccount() error = %v", err)
	}

	// 作成時の送信（登録方式・ワーカー経由）
	runWorkerUntil(t, db, jobqueue.HandlerMap{InvitationEmailJobType: c.InvitationEmailHandler()})

	// 再送（即時方式）
	got, err := c.RequestInvitationEmail(ctx, admin.ID, DeliveryImmediate)
	if err != nil || got != InvitationSent {
		t.Fatalf("RequestInvitationEmail(再送) = %v, %v, want InvitationSent", got, err)
	}

	mails := sender.sent()
	if len(mails) != 2 || mails[0] != mails[1] {
		t.Errorf("送信したメール = %+v, want 作成時と再送で同じ件名・本文・リンクの2件", mails)
	}

	old := mustInsertUser(t, db,
		userSeed{email: "old@example.com", roleID: refs.roleIDs[2], deactivated: true})

	got, err = c.RequestInvitationEmail(ctx, old, DeliveryImmediate)
	if err != nil || got != InvitationSkipped {
		t.Errorf("RequestInvitationEmail(無効化済み) = %v, %v, want InvitationSkipped", got, err)
	}

	tokens.err = errors.New("failed")
	got, err = c.RequestInvitationEmail(ctx, admin.ID, DeliveryImmediate)
	if err != nil || got != InvitationFailed {
		t.Errorf("RequestInvitationEmail(失敗) = %v, %v, want InvitationFailed・エラーなし", got, err)
	}
}
