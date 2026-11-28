package worker

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue"
)

const testTimeout = 5 * time.Second

func newTestWorker(db *gorm.DB, handlers jobqueue.HandlerMap) *Worker {
	return NewWorker(db, discardLogger(), handlers)
}

func pendingJob(jobType string) Job {
	return Job{
		Type:        jobType,
		Payload:     `{"id":1}`,
		Status:      StatusPending,
		MaxAttempts: 3,
		RunAfter:    time.Now().Add(-time.Minute),
	}
}

func jobWithAttempts(attempts int) Job {
	j := pendingJob("t")
	j.Attempts = attempts

	return j
}

func futureJob() Job {
	j := pendingJob("t")
	j.RunAfter = time.Now().Add(time.Hour)

	return j
}

type runOnceCase struct {
	name         string
	job          Job
	handler      jobqueue.Handler
	wantStatus   string
	wantAttempts int
	wantCalled   bool
}

var errHandler = errors.New("handler failed")

func runOnceCases() []runOnceCase {
	return []runOnceCase{
		{
			name:         "ハンドラが成功するとcompletedになる",
			job:          pendingJob("t"),
			handler:      func(context.Context, []byte) error { return nil },
			wantStatus:   StatusCompleted,
			wantAttempts: 1,
			wantCalled:   true,
		},
		{
			name:         "失敗して試行回数が上限未満ならpendingに戻る",
			job:          pendingJob("t"),
			handler:      func(context.Context, []byte) error { return errHandler },
			wantStatus:   StatusPending,
			wantAttempts: 1,
			wantCalled:   true,
		},
		{
			name:         "失敗して試行回数が上限に達したらfailedになる",
			job:          jobWithAttempts(2),
			handler:      func(context.Context, []byte) error { return errHandler },
			wantStatus:   StatusFailed,
			wantAttempts: 3,
			wantCalled:   true,
		},
		{
			name:         "ハンドラがpanicしても失敗として扱いプロセスは継続する",
			job:          pendingJob("t"),
			handler:      func(context.Context, []byte) error { panic("boom") },
			wantStatus:   StatusPending,
			wantAttempts: 1,
			wantCalled:   true,
		},
		{
			name:         "ハンドラが未登録の種別は失敗として扱う",
			job:          pendingJob("unknown"),
			handler:      func(context.Context, []byte) error { return nil },
			wantStatus:   StatusPending,
			wantAttempts: 1,
			wantCalled:   false,
		},
		{
			name:         "run_afterが未来のジョブは処理しない",
			job:          futureJob(),
			handler:      func(context.Context, []byte) error { return nil },
			wantStatus:   StatusPending,
			wantAttempts: 0,
			wantCalled:   false,
		},
	}
}

func TestWorker_RunOnce(t *testing.T) {
	for _, tt := range runOnceCases() {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			job := mustCreateJob(t, db, tt.job)

			var called bool
			var gotPayload string

			w := newTestWorker(db, jobqueue.HandlerMap{
				"t": func(ctx context.Context, payload []byte) error {
					called = true
					gotPayload = string(payload)

					return tt.handler(ctx, payload)
				},
			})

			w.runOnce(t.Context())

			got := mustFindJob(t, db, job.ID)
			if got.Status != tt.wantStatus || got.Attempts != tt.wantAttempts {
				t.Errorf("job = {Status:%q Attempts:%d}, want {%q %d}",
					got.Status, got.Attempts, tt.wantStatus, tt.wantAttempts)
			}

			if called != tt.wantCalled {
				t.Errorf("handler called = %v, want %v", called, tt.wantCalled)
			}

			if tt.wantCalled && gotPayload != `{"id":1}` {
				t.Errorf("payload = %q, want %q", gotPayload, `{"id":1}`)
			}
		})
	}
}

func TestWorker_Reclaim(t *testing.T) {
	old := time.Now().Add(-time.Hour)
	fresh := time.Now()

	tests := []struct {
		name       string
		status     string
		attempts   int
		updatedAt  time.Time
		wantStatus string
	}{
		{"更新が途絶えたprocessingはpendingに戻る", StatusProcessing, 1, old, StatusPending},
		{"更新が途絶え試行回数が上限に達したprocessingはfailedになる",
			StatusProcessing, 3, old, StatusFailed},
		{"更新が新しいprocessingは回収しない", StatusProcessing, 1, fresh, StatusProcessing},
		{"processing以外は回収しない", StatusCompleted, 1, old, StatusCompleted},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)

			j := pendingJob("t")
			j.Status = tt.status
			j.Attempts = tt.attempts
			j.UpdatedAt = tt.updatedAt
			job := mustCreateJob(t, db, j)

			w := newTestWorker(db, nil)
			if err := w.reclaim(t.Context()); err != nil {
				t.Fatalf("reclaim() error = %v, want nil", err)
			}

			if got := mustFindJob(t, db, job.ID); got.Status != tt.wantStatus {
				t.Errorf("Status = %q, want %q", got.Status, tt.wantStatus)
			}
		})
	}
}

// fetchTally は fetch で取得できたジョブIDごとの取得回数を集計します。
type fetchTally struct {
	mu   sync.Mutex
	seen map[uint]int
}

func (f *fetchTally) add(jobs []Job) {
	f.mu.Lock()
	defer f.mu.Unlock()

	for _, j := range jobs {
		f.seen[j.ID]++
	}
}

func fetchConcurrently(t *testing.T, w *Worker, workers, limit int, tally *fetchTally) {
	t.Helper()

	var wg sync.WaitGroup

	for range workers {
		wg.Add(1)

		go func() {
			defer wg.Done()

			jobs, err := w.fetch(context.Background(), limit)
			if err != nil {
				t.Errorf("fetch() error = %v, want nil", err)
				return
			}

			tally.add(jobs)
		}()
	}

	wg.Wait()
}

func TestWorker_Fetch_Exclusive(t *testing.T) {
	const total = 10

	db := setupTestDB(t)
	for range total {
		mustCreateJob(t, db, pendingJob("t"))
	}

	w := newTestWorker(db, nil)
	tally := &fetchTally{seen: make(map[uint]int)}

	fetchConcurrently(t, w, 4, 5, tally)

	// 同時取得で取り残された分は、次回以降のポーリングで取得される
	for range total {
		jobs, err := w.fetch(context.Background(), 5)
		if err != nil {
			t.Fatalf("fetch() error = %v, want nil", err)
		}

		if len(jobs) == 0 {
			break
		}

		tally.add(jobs)
	}

	if len(tally.seen) != total {
		t.Fatalf("取得できたジョブ数 = %d, want %d", len(tally.seen), total)
	}

	for id, n := range tally.seen {
		if n != 1 {
			t.Errorf("ジョブ(id=%d)が%d回取得されました, want 1", id, n)
		}
	}

	var processing int64
	if err := db.Model(&Job{}).Where("status = ? AND attempts = 1", StatusProcessing).
		Count(&processing).Error; err != nil {
		t.Fatalf("Countに失敗しました: %v", err)
	}

	if processing != total {
		t.Errorf("processing = %d, want %d", processing, total)
	}
}

func TestWorker_Heartbeat(t *testing.T) {
	db := setupTestDB(t)
	job := mustCreateJob(t, db, pendingJob("t"))

	started := make(chan struct{})
	release := make(chan struct{})

	w := newTestWorker(db, jobqueue.HandlerMap{
		"t": func(context.Context, []byte) error {
			close(started)
			<-release

			return nil
		},
	})
	w.heartbeatInterval = 20 * time.Millisecond

	done := make(chan struct{})

	go func() {
		defer close(done)
		w.runOnce(context.Background())
	}()

	waitOrFail(t, started, "ハンドラの開始")

	first := mustFindJob(t, db, job.ID).UpdatedAt

	deadline := time.Now().Add(testTimeout)
	for !mustFindJob(t, db, job.ID).UpdatedAt.After(first) {
		if time.Now().After(deadline) {
			t.Fatalf("処理中にupdated_atが更新されませんでした")
		}

		time.Sleep(10 * time.Millisecond)
	}

	close(release)
	waitOrFail(t, done, "runOnceの終了")

	if got := mustFindJob(t, db, job.ID); got.Status != StatusCompleted {
		t.Errorf("Status = %q, want %q", got.Status, StatusCompleted)
	}
}

func TestWorker_Run(t *testing.T) {
	db := setupTestDB(t)
	job := mustCreateJob(t, db, pendingJob("t"))

	handled := make(chan struct{})

	w := newTestWorker(db, jobqueue.HandlerMap{
		"t": func(context.Context, []byte) error {
			close(handled)
			return nil
		},
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan struct{})

	go func() {
		defer close(done)
		w.Run(ctx, 10*time.Millisecond)
	}()

	waitOrFail(t, handled, "ジョブの処理")

	cancel()
	waitOrFail(t, done, "Runの終了")

	deadline := time.Now().Add(testTimeout)
	for mustFindJob(t, db, job.ID).Status != StatusCompleted {
		if time.Now().After(deadline) {
			t.Fatalf("ジョブがcompletedになりませんでした")
		}

		time.Sleep(10 * time.Millisecond)
	}
}

func waitOrFail(t *testing.T, ch <-chan struct{}, what string) {
	t.Helper()

	select {
	case <-ch:
	case <-time.After(testTimeout):
		t.Fatalf("%sがタイムアウトしました", what)
	}
}
