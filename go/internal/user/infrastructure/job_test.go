package infrastructure

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue/worker"
	"github.com/yuta20253/edu-platform/go/internal/shared/transaction/gormtx"
)

// failingPublisher は Publish が常に失敗する JobPublisher です。
type failingPublisher struct{ err error }

func (p failingPublisher) Publish(context.Context, string, any, time.Time) error { return p.err }

func mustListInvitationJobs(t *testing.T, db *gorm.DB) []worker.Job {
	t.Helper()

	var jobs []worker.Job
	if err := db.Where("type = ?", "user_invitation_email").Order("id").Find(&jobs).Error; err != nil {
		t.Fatalf("jobsの取得に失敗しました: %v", err)
	}

	return jobs
}

func TestEnqueueInvitationEmail(t *testing.T) {
	db, _ := setupTestDB(t)
	before := time.Now().Add(-time.Second)

	if err := enqueueInvitationEmail(t.Context(), worker.NewPublisher(db), 42); err != nil {
		t.Fatalf("enqueueInvitationEmail() error = %v, want nil", err)
	}

	jobs := mustListInvitationJobs(t, db)
	if len(jobs) != 1 {
		t.Fatalf("len(jobs) = %d, want 1", len(jobs))
	}

	if jobs[0].Payload != `{"user_id":42}` || jobs[0].Status != worker.StatusPending {
		t.Errorf("job = {Payload:%q Status:%q}, want {%q pending}",
			jobs[0].Payload, jobs[0].Status, `{"user_id":42}`)
	}

	if jobs[0].RunAfter.Before(before) || jobs[0].RunAfter.After(time.Now().Add(time.Second)) {
		t.Errorf("RunAfter = %v, want 現在時刻（即時実行）", jobs[0].RunAfter)
	}
}

func TestEnqueueInvitationEmail_Transaction(t *testing.T) {
	errBoom := errors.New("boom")

	tests := []struct {
		name      string
		fnErr     error
		wantCount int
	}{
		{name: "呼び出し側のトランザクションがコミットされると依頼が残る", wantCount: 1},
		{name: "呼び出し側のトランザクションがロールバックされると依頼も残らない",
			fnErr: errBoom, wantCount: 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, _ := setupTestDB(t)
			pub := worker.NewPublisher(db)

			err := gormtx.RunInTx(t.Context(), db, func(ctx context.Context, _ *gorm.DB) error {
				if err := enqueueInvitationEmail(ctx, pub, 7); err != nil {
					return err
				}

				return tt.fnErr
			})
			if !errors.Is(err, tt.fnErr) {
				t.Fatalf("RunInTx() error = %v, want %v", err, tt.fnErr)
			}

			if got := len(mustListInvitationJobs(t, db)); got != tt.wantCount {
				t.Errorf("len(jobs) = %d, want %d", got, tt.wantCount)
			}
		})
	}
}

func TestEnqueueInvitationEmail_PublishError(t *testing.T) {
	errPublish := errors.New("publish failed")

	err := EnqueueInvitationEmail(t.Context(), failingPublisher{err: errPublish}, 1)
	if !errors.Is(err, errPublish) {
		t.Errorf("EnqueueInvitationEmail() error = %v, want %v", err, errPublish)
	}
}

func TestDecodeInvitationEmailPayload(t *testing.T) {
	tests := []struct {
		name    string
		payload string
		want    uint
		wantErr bool
	}{
		{name: "登録時のpayloadからユーザーIDを取り出す", payload: `{"user_id":42}`, want: 42},
		{name: "JSONでなければエラー", payload: `{`, wantErr: true},
		{name: "ユーザーIDが無ければエラー", payload: `{}`, wantErr: true},
		{name: "ユーザーIDが0ならエラー", payload: `{"user_id":0}`, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := DecodeInvitationEmailPayload([]byte(tt.payload))
			if (err != nil) != tt.wantErr || got != tt.want {
				t.Errorf("DecodeInvitationEmailPayload(%s) = %d, %v, want %d, wantErr %v",
					tt.payload, got, err, tt.want, tt.wantErr)
			}
		})
	}
}

func TestInvitationEmailJobType(t *testing.T) {
	if got := fmt.Sprint(InvitationEmailJobType); got != "user_invitation_email" {
		t.Errorf("InvitationEmailJobType = %q, want %q", got, "user_invitation_email")
	}
}
