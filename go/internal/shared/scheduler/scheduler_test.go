package scheduler

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

const (
	testInterval = 10 * time.Millisecond
	testTimeout  = 5 * time.Second
)

func startRun(t *testing.T, tasks TaskMap) (cancel func(), done <-chan struct{}) {
	t.Helper()

	ctx, cancelCtx := context.WithCancel(context.Background())
	doneCh := make(chan struct{})

	go func() {
		defer close(doneCh)
		Run(ctx, testInterval, tasks)
	}()

	t.Cleanup(func() {
		cancelCtx()
		<-doneCh
	})

	return cancelCtx, doneCh
}

func waitFor(t *testing.T, what string, cond func() bool) {
	t.Helper()

	deadline := time.Now().Add(testTimeout)
	for !cond() {
		if time.Now().After(deadline) {
			t.Fatalf("%sがタイムアウトしました", what)
		}

		time.Sleep(time.Millisecond)
	}
}

func TestRun_ExecutesTasksPeriodically(t *testing.T) {
	var a, b atomic.Int32

	startRun(t, TaskMap{
		"a": func(context.Context) error { a.Add(1); return nil },
		"b": func(context.Context) error { b.Add(1); return nil },
	})

	waitFor(t, "全タスクの複数回実行", func() bool { return a.Load() >= 2 && b.Load() >= 2 })
}

func TestRun_ContinuesAfterTaskFailure(t *testing.T) {
	tests := []struct {
		name string
		bad  Task
	}{
		{
			name: "タスクがエラーを返しても他のタスクと次の周期を続ける",
			bad:  func(context.Context) error { return errors.New("failed") },
		},
		{
			name: "タスクがpanicしても他のタスクと次の周期を続ける",
			bad:  func(context.Context) error { panic("boom") },
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var good atomic.Int32

			startRun(t, TaskMap{
				"bad":  tt.bad,
				"good": func(context.Context) error { good.Add(1); return nil },
			})

			waitFor(t, "正常なタスクの複数回実行", func() bool { return good.Load() >= 3 })
		})
	}
}

func TestRun_ReturnsOnCancelWithoutWaitingForTask(t *testing.T) {
	started := make(chan struct{})
	release := make(chan struct{})

	var once sync.Once

	cancel, done := startRun(t, TaskMap{
		"blocking": func(context.Context) error {
			once.Do(func() { close(started) })
			<-release

			return nil
		},
	})

	select {
	case <-started:
	case <-time.After(testTimeout):
		t.Fatalf("タスクが開始しませんでした")
	}

	cancel()

	select {
	case <-done:
	case <-time.After(testTimeout):
		t.Fatalf("ctxのキャンセル後もRunが戻りません")
	}

	close(release)
}

func TestRun_DoesNotOverlapExecutions(t *testing.T) {
	var running, maxRunning, calls atomic.Int32

	startRun(t, TaskMap{
		"slow": func(context.Context) error {
			n := running.Add(1)
			defer running.Add(-1)

			for {
				m := maxRunning.Load()
				if n <= m || maxRunning.CompareAndSwap(m, n) {
					break
				}
			}

			time.Sleep(5 * testInterval)
			calls.Add(1)

			return nil
		},
	})

	waitFor(t, "タスクの複数回実行", func() bool { return calls.Load() >= 2 })

	if got := maxRunning.Load(); got != 1 {
		t.Errorf("同時実行数の最大 = %d, want 1", got)
	}
}

func TestRun_NoTasks(t *testing.T) {
	cancel, done := startRun(t, TaskMap{})

	cancel()

	select {
	case <-done:
	case <-time.After(testTimeout):
		t.Fatalf("タスクが無い場合にctxのキャンセル後もRunが戻りません")
	}
}

func TestTaskMap_Merge(t *testing.T) {
	noop := func(context.Context) error { return nil }

	tests := []struct {
		name      string
		base      TaskMap
		other     TaskMap
		wantNames []string
		wantPanic bool
	}{
		{
			name:      "重複しない名前はすべて登録される",
			base:      TaskMap{"a": noop},
			other:     TaskMap{"b": noop, "c": noop},
			wantNames: []string{"a", "b", "c"},
		},
		{
			name:      "空のマップをマージしても変わらない",
			base:      TaskMap{"a": noop},
			other:     nil,
			wantNames: []string{"a"},
		},
		{
			name:      "名前が重複するとpanicする",
			base:      TaskMap{"a": noop},
			other:     TaskMap{"a": noop},
			wantPanic: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			defer func() {
				r := recover()
				if (r != nil) != tt.wantPanic {
					t.Fatalf("panic = %v, wantPanic %v", r, tt.wantPanic)
				}
			}()

			tt.base.Merge(tt.other)

			if len(tt.base) != len(tt.wantNames) {
				t.Fatalf("len = %d, want %d", len(tt.base), len(tt.wantNames))
			}

			for _, name := range tt.wantNames {
				if _, ok := tt.base[name]; !ok {
					t.Errorf("タスク %q が登録されていません", name)
				}
			}
		})
	}
}
