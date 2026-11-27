// Package scheduler は、登録されたジョブがなくても周期的に対象を探して処理するための
// 定期実行の共通基盤を提供します。GORMには依存しません。
package scheduler

import (
	"context"
	"fmt"
	"log/slog"
	"maps"
	"slices"
	"sync/atomic"
	"time"
)

// Task は定期実行する処理です。途中で打ち切られても再実行で安全なように実装します。
type Task func(ctx context.Context) error

// TaskMap は定期実行するタスクの集合です。キーはログ出力用の識別名です。
type TaskMap map[string]Task

// Merge は other のタスクを m へ追加します。
// 同じ名前が既に登録されている場合は、起動時の設定ミスとして panic します。
func (m TaskMap) Merge(other TaskMap) {
	for name, task := range other {
		if _, exists := m[name]; exists {
			panic(fmt.Sprintf("scheduler: タスク名 %q が重複しています", name))
		}

		m[name] = task
	}
}

// Run は interval ごとに tasks をすべて実行します。ctx がキャンセルされると、
// 実行中のタスクの完了を待たずに戻ります。
// 前の周期の実行が終わっていない場合、その周期の実行は見送ります。
// タスクのエラーとpanicは slog のデフォルトロガーに出力し、他のタスクと次の周期は続けます。
func Run(ctx context.Context, interval time.Duration, tasks TaskMap) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	var running atomic.Bool

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		if !running.CompareAndSwap(false, true) {
			slog.WarnContext(ctx, "scheduler skipped a cycle because the previous one is running")
			continue
		}

		go func() {
			defer running.Store(false)

			runAll(ctx, tasks)
		}()
	}
}

func runAll(ctx context.Context, tasks TaskMap) {
	for _, name := range slices.Sorted(maps.Keys(tasks)) {
		if ctx.Err() != nil {
			return
		}

		runTask(ctx, name, tasks[name])
	}
}

func runTask(ctx context.Context, name string, task Task) {
	defer func() {
		if r := recover(); r != nil {
			slog.ErrorContext(ctx, "scheduled task panicked", "task", name, "recovered", r)
		}
	}()

	if err := task(ctx); err != nil {
		slog.ErrorContext(ctx, "scheduled task failed", "task", name, "error", err)
	}
}
