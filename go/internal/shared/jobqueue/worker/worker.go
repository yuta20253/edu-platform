package worker

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue"
)

const (
	defaultBatchSize         = 10
	defaultHeartbeatInterval = 30 * time.Second
	defaultReclaimAfter      = 3 * time.Minute
)

// Worker は jobs テーブルをポーリングし、登録済みのハンドラでジョブを処理します。
type Worker struct {
	db                *gorm.DB
	logger            *slog.Logger
	handlers          jobqueue.HandlerMap
	batchSize         int
	heartbeatInterval time.Duration
	reclaimAfter      time.Duration
}

// NewWorker は Worker を返します。
// 回収の閾値(reclaimAfter)はハートビート間隔の3倍にしています。
func NewWorker(db *gorm.DB, logger *slog.Logger, handlers jobqueue.HandlerMap) *Worker {
	return &Worker{
		db:                db,
		logger:            logger,
		handlers:          handlers,
		batchSize:         defaultBatchSize,
		heartbeatInterval: defaultHeartbeatInterval,
		reclaimAfter:      defaultReclaimAfter,
	}
}

// Run は起動時と interval ごとに、処理中のまま止まったジョブの回収と、
// 実行可能なジョブの取得・処理を行います。ctx がキャンセルされると戻ります。
func (w *Worker) Run(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		w.runOnce(ctx)

		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (w *Worker) runOnce(ctx context.Context) {
	if err := w.reclaim(ctx); err != nil {
		w.logger.ErrorContext(ctx, "failed to reclaim jobs", "error", err)
	}

	jobs, err := w.fetch(ctx, w.batchSize)
	if err != nil {
		w.logger.ErrorContext(ctx, "failed to fetch jobs", "error", err)
		return
	}

	for _, job := range jobs {
		w.process(ctx, job)
	}
}

// fetch は実行可能なジョブを排他的に取得し、同一トランザクションで processing へ遷移させます。
// 取得時に attempts を加算するため、返す Job の Attempts は加算後の値です。
func (w *Worker) fetch(ctx context.Context, limit int) ([]Job, error) {
	var jobs []Job

	err := w.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
			Where("status = ? AND run_after <= ?", StatusPending, time.Now()).
			Order("run_after").
			Limit(limit).
			Find(&jobs).Error; err != nil {
			return err
		}

		if len(jobs) == 0 {
			return nil
		}

		ids := make([]uint, 0, len(jobs))
		for _, j := range jobs {
			ids = append(ids, j.ID)
		}

		return tx.Model(&Job{}).Where("id IN ?", ids).
			Updates(map[string]any{
				"status":   StatusProcessing,
				"attempts": gorm.Expr("attempts + 1"),
			}).Error
	})
	if err != nil {
		return nil, fmt.Errorf("ジョブの取得に失敗しました: %w", err)
	}

	for i := range jobs {
		jobs[i].Status = StatusProcessing
		jobs[i].Attempts++
	}

	return jobs, nil
}

// reclaim は updated_at が reclaimAfter を超えて更新されていない processing のジョブを回収します。
// 試行回数が上限に達していれば failed、そうでなければ pending に戻します。
func (w *Worker) reclaim(ctx context.Context) error {
	threshold := time.Now().Add(-w.reclaimAfter)

	stale := func() *gorm.DB {
		return w.db.WithContext(ctx).Model(&Job{}).
			Where("status = ? AND updated_at < ?", StatusProcessing, threshold)
	}

	if err := stale().Where("attempts >= max_attempts").
		Update("status", StatusFailed).Error; err != nil {
		return fmt.Errorf("ジョブのfailedへの回収に失敗しました: %w", err)
	}

	if err := stale().Where("attempts < max_attempts").
		Update("status", StatusPending).Error; err != nil {
		return fmt.Errorf("ジョブのpendingへの回収に失敗しました: %w", err)
	}

	return nil
}

// process はハンドラを呼び出し、結果に応じてジョブの状態を更新します。
// 失敗はここで1回だけログに出力します。
func (w *Worker) process(ctx context.Context, job Job) {
	err := w.runHandler(ctx, job)

	// ctxがキャンセルされた場合でも、処理結果は記録する
	if recordErr := w.record(context.WithoutCancel(ctx), job, err); recordErr != nil {
		w.logger.ErrorContext(ctx, "failed to record job result",
			"job_id", job.ID, "job_type", job.Type, "error", recordErr)
	}

	if err != nil {
		w.logger.LogAttrs(ctx, failureLevel(job), "job failed",
			slog.Uint64("job_id", uint64(job.ID)),
			slog.String("job_type", job.Type),
			slog.Int("attempts", job.Attempts),
			slog.Any("error", err),
		)
	}
}

func failureLevel(job Job) slog.Level {
	if job.Attempts >= job.MaxAttempts {
		return slog.LevelError
	}

	return slog.LevelWarn
}

// runHandler はハートビートで囲んでハンドラを実行します。
// ハンドラのpanicは recover し、このジョブの失敗として扱います。
func (w *Worker) runHandler(ctx context.Context, job Job) (err error) {
	hbCtx, stop := context.WithCancel(ctx)
	hbDone := make(chan struct{})

	go func() {
		defer close(hbDone)
		w.heartbeat(hbCtx, job.ID)
	}()

	defer func() {
		stop()
		<-hbDone
	}()

	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("ジョブの処理中にpanicしました: %v", r)
		}
	}()

	handler, ok := w.handlers[job.Type]
	if !ok {
		return fmt.Errorf("ジョブの種別 %q のハンドラが登録されていません", job.Type)
	}

	return handler(ctx, []byte(job.Payload))
}

func (w *Worker) heartbeat(ctx context.Context, jobID uint) {
	ticker := time.NewTicker(w.heartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// 既に回収された行を生き返らせないよう、statusが processing の間だけ更新する
			err := w.db.WithContext(ctx).Model(&Job{}).
				Where("id = ? AND status = ?", jobID, StatusProcessing).
				Update("updated_at", time.Now()).Error
			if err != nil && ctx.Err() == nil {
				w.logger.WarnContext(ctx, "failed to update job heartbeat",
					"job_id", jobID, "error", err)
			}
		}
	}
}

func (w *Worker) record(ctx context.Context, job Job, handlerErr error) error {
	next := StatusCompleted

	switch {
	case handlerErr == nil:
	case job.Attempts >= job.MaxAttempts:
		next = StatusFailed
	default:
		next = StatusPending
	}

	if err := w.db.WithContext(ctx).Model(&Job{}).
		Where("id = ? AND status = ?", job.ID, StatusProcessing).
		Update("status", next).Error; err != nil {
		return fmt.Errorf("ジョブの状態の更新に失敗しました: %w", err)
	}

	return nil
}
