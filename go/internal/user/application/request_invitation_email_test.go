package application

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"testing"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/transaction/gormtx"
)

// invitationFixture は招待メールのテストで使うユーザーです。
type invitationFixture struct {
	pending     uint // 招待待ちの教員
	completed   uint // 招待待ちでない教員（管理者経路）
	deactivated uint // 無効化済みの教員
}

func setupInvitationFixture(t *testing.T) (*gorm.DB, testDeps, invitationFixture) {
	t.Helper()

	db, refs := setupTestDB(t)
	f := invitationFixture{
		pending: mustInsertUser(t, db, userSeed{email: "pending@example.com",
			roleID: refs.roleIDs[2], highSchoolID: ptr(refs.highSchoolA), pending: true}),
		completed: mustInsertUser(t, db, userSeed{email: "completed@example.com",
			roleID: refs.roleIDs[2], highSchoolID: ptr(refs.highSchoolA)}),
		deactivated: mustInsertUser(t, db, userSeed{email: "old@example.com",
			roleID: refs.roleIDs[2], highSchoolID: ptr(refs.highSchoolA), pending: true, deactivated: true}),
	}

	return db, newTestService(db, refs), f
}

func TestService_RequestInvitationEmail_Guard(t *testing.T) {
	_, d, f := setupInvitationFixture(t)

	tests := []struct {
		name    string
		userID  uint
		mode    DeliveryMode
		wantErr error
	}{
		{"userIDが0はエラー", 0, DeliveryImmediate, ErrUserIDRequired},
		{"modeが未指定はエラー", f.pending, DeliveryMode(0), ErrDeliveryModeRequired},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := d.svc.RequestInvitationEmail(t.Context(), tt.userID, tt.mode)
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("RequestInvitationEmail() error = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

type immediateCase struct {
	name       string
	userID     func(f invitationFixture) uint
	tokenErr   error
	mailErr    error
	want       InvitationResult
	wantSentTo string
}

func immediateCases() []immediateCase {
	errFail := errors.New("failed")

	return []immediateCase{
		{name: "送信に成功するとInvitationSent", userID: func(f invitationFixture) uint { return f.pending },
			want: InvitationSent, wantSentTo: "pending@example.com"},
		{name: "招待待ちでない教員にも送信する", userID: func(f invitationFixture) uint { return f.completed },
			want: InvitationSent, wantSentTo: "completed@example.com"},
		{name: "トークン発行の失敗はInvitationFailed", userID: func(f invitationFixture) uint { return f.pending },
			tokenErr: errFail, want: InvitationFailed},
		{name: "メール送信の失敗はInvitationFailed", userID: func(f invitationFixture) uint { return f.pending },
			mailErr: errFail, want: InvitationFailed},
		{name: "存在しないユーザーはInvitationSkipped", userID: func(invitationFixture) uint { return 99999999 },
			want: InvitationSkipped},
		{name: "無効化済みのユーザーはInvitationSkipped",
			userID: func(f invitationFixture) uint { return f.deactivated }, want: InvitationSkipped},
	}
}

func TestService_RequestInvitationEmail_Immediate(t *testing.T) {
	for _, tt := range immediateCases() {
		t.Run(tt.name, func(t *testing.T) {
			_, d, f := setupInvitationFixture(t)
			d.tokenIssuer.err = tt.tokenErr
			d.mailer.err = tt.mailErr

			got, err := d.svc.RequestInvitationEmail(t.Context(), tt.userID(f), DeliveryImmediate)
			if err != nil || got != tt.want {
				t.Fatalf("RequestInvitationEmail() = %v, %v, want %v, nil", got, err, tt.want)
			}

			var want []sentMail
			if tt.wantSentTo != "" {
				want = []sentMail{{to: tt.wantSentTo, token: "raw-token"}}
			}

			if !reflect.DeepEqual(d.mailer.sent, want) {
				t.Errorf("送信したメール = %+v, want %+v", d.mailer.sent, want)
			}

			if tt.want == InvitationSkipped && len(d.tokenIssuer.issued) != 0 {
				t.Errorf("トークンを発行しました: %v, want 発行しない", d.tokenIssuer.issued)
			}
		})
	}
}

func TestService_RequestInvitationEmail_Enqueue(t *testing.T) {
	db, d, f := setupInvitationFixture(t)

	if _, err := d.svc.RequestInvitationEmail(t.Context(), f.completed, DeliveryEnqueue); err != nil {
		t.Fatalf("RequestInvitationEmail() error = %v, want nil", err)
	}

	payloads := invitationJobPayloads(t, db)
	if len(payloads) != 1 || payloads[0] != fmt.Sprintf(`{"user_id":%d}`, f.completed) {
		t.Errorf("jobs = %v, want 送信依頼1件", payloads)
	}

	if len(d.mailer.sent) != 0 || len(d.tokenIssuer.issued) != 0 {
		t.Errorf("登録方式でその場で送信しました: mails=%v tokens=%v", d.mailer.sent, d.tokenIssuer.issued)
	}
}

func TestService_RequestInvitationEmail_EnqueueRollback(t *testing.T) {
	db, d, f := setupInvitationFixture(t)
	errBoom := errors.New("boom")

	err := gormtx.RunInTx(t.Context(), db, func(ctx context.Context, _ *gorm.DB) error {
		if _, err := d.svc.RequestInvitationEmail(ctx, f.pending, DeliveryEnqueue); err != nil {
			return err
		}

		return errBoom
	})
	if !errors.Is(err, errBoom) {
		t.Fatalf("RunInTx() error = %v, want %v", err, errBoom)
	}

	if p := invitationJobPayloads(t, db); len(p) != 0 {
		t.Errorf("jobs = %v, want なし（ロールバックで依頼も取り消される）", p)
	}
}

func TestService_HandleInvitationEmailJob(t *testing.T) {
	tests := []struct {
		name     string
		payload  func(f invitationFixture) string
		tokenErr error
		wantErr  bool
		wantSent int
	}{
		{name: "送信成功は完了（nil）", payload: func(f invitationFixture) string {
			return fmt.Sprintf(`{"user_id":%d}`, f.pending)
		}, wantSent: 1},
		{name: "送信対象外は完了（nil。再試行しない）", payload: func(f invitationFixture) string {
			return fmt.Sprintf(`{"user_id":%d}`, f.deactivated)
		}},
		{name: "送信失敗はエラー（再試行する）", payload: func(f invitationFixture) string {
			return fmt.Sprintf(`{"user_id":%d}`, f.pending)
		}, tokenErr: errors.New("failed"), wantErr: true},
		{name: "payloadが不正ならエラー", payload: func(invitationFixture) string { return `{` },
			wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, d, f := setupInvitationFixture(t)
			d.tokenIssuer.err = tt.tokenErr

			err := d.svc.HandleInvitationEmailJob(t.Context(), []byte(tt.payload(f)))
			if (err != nil) != tt.wantErr {
				t.Errorf("HandleInvitationEmailJob() error = %v, wantErr %v", err, tt.wantErr)
			}

			if len(d.mailer.sent) != tt.wantSent {
				t.Errorf("送信件数 = %d, want %d", len(d.mailer.sent), tt.wantSent)
			}
		})
	}
}
