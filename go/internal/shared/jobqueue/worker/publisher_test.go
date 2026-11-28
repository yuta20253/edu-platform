package worker

import (
	"context"
	"errors"
	"testing"
	"time"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/transaction/gormtx"
)

type samplePayload struct {
	ImportID uint   `json:"import_id"`
	Name     string `json:"name"`
}

type publishCase struct {
	name        string
	payload     any
	wantPayload string
	wantErr     bool
}

func publishCases() []publishCase {
	return []publishCase{
		{
			name:        "構造体はJSON文字列として保存される",
			payload:     samplePayload{ImportID: 7, Name: "csv"},
			wantPayload: `{"import_id":7,"name":"csv"}`,
		},
		{
			name:        "nilはJSONのnullとして保存される",
			payload:     nil,
			wantPayload: `null`,
		},
		{
			name:    "JSONにできないpayloadはエラーになり登録されない",
			payload: make(chan int),
			wantErr: true,
		},
	}
}

func mustListJobs(t *testing.T, db *gorm.DB) []Job {
	t.Helper()

	var jobs []Job
	if err := db.Find(&jobs).Error; err != nil {
		t.Fatalf("Findに失敗しました: %v", err)
	}

	return jobs
}

func assertPublishedJob(t *testing.T, got Job, wantPayload string, runAfter time.Time) {
	t.Helper()

	if got.Type != "question_import" || got.Payload != wantPayload {
		t.Errorf("job = {Type:%q Payload:%q}, want {question_import %q}",
			got.Type, got.Payload, wantPayload)
	}

	if got.Status != StatusPending || got.Attempts != 0 || got.MaxAttempts != DefaultMaxAttempts {
		t.Errorf("job = {Status:%q Attempts:%d MaxAttempts:%d}, want {pending 0 %d}",
			got.Status, got.Attempts, got.MaxAttempts, DefaultMaxAttempts)
	}

	if !got.RunAfter.Equal(runAfter) {
		t.Errorf("RunAfter = %v, want %v", got.RunAfter, runAfter)
	}
}

func TestPublisher_Publish(t *testing.T) {
	runAfter := time.Now().Add(time.Hour).UTC().Truncate(time.Second)

	for _, tt := range publishCases() {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)

			err := NewPublisher(db).Publish(t.Context(), "question_import", tt.payload, runAfter)
			jobs := mustListJobs(t, db)

			if tt.wantErr {
				if err == nil {
					t.Fatalf("Publish() error = nil, want error")
				}

				if len(jobs) != 0 {
					t.Errorf("len(jobs) = %d, want 0", len(jobs))
				}

				return
			}

			if err != nil {
				t.Fatalf("Publish() error = %v, want nil", err)
			}

			if len(jobs) != 1 {
				t.Fatalf("len(jobs) = %d, want 1", len(jobs))
			}

			assertPublishedJob(t, jobs[0], tt.wantPayload, runAfter)
		})
	}
}

func TestPublisher_Publish_Transaction(t *testing.T) {
	errBoom := errors.New("boom")

	tests := []struct {
		name      string
		fnErr     error
		wantCount int64
	}{
		{name: "呼び出し側のトランザクションがコミットされるとジョブも残る", wantCount: 1},
		{name: "呼び出し側のトランザクションがロールバックされるとジョブも残らない",
			fnErr: errBoom, wantCount: 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			pub := NewPublisher(db)

			err := gormtx.RunInTx(t.Context(), db, func(ctx context.Context, _ *gorm.DB) error {
				if err := pub.Publish(ctx, "announcement_publish", nil, time.Now()); err != nil {
					return err
				}

				return tt.fnErr
			})
			if !errors.Is(err, tt.fnErr) {
				t.Fatalf("RunInTx() error = %v, want %v", err, tt.fnErr)
			}

			var count int64
			if err := db.Model(&Job{}).Count(&count).Error; err != nil {
				t.Fatalf("Countに失敗しました: %v", err)
			}

			if count != tt.wantCount {
				t.Errorf("count = %d, want %d", count, tt.wantCount)
			}
		})
	}
}
