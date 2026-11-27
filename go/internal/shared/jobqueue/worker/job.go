// Package worker は jobs テーブルのGORMモデル、jobqueue.JobPublisher の実装、
// および jobs テーブルをポーリングして処理するワーカーを提供します。
package worker

import "time"

// ジョブの状態です。
const (
	StatusPending    = "pending"
	StatusProcessing = "processing"
	StatusCompleted  = "completed"
	StatusFailed     = "failed"
)

// DefaultMaxAttempts は登録するジョブの最大試行回数です。
const DefaultMaxAttempts = 3

// Job は jobs テーブルの1行です。Payload はJSON文字列です。
// (status, run_after) の複合インデックスにより、取得時のロックが取得対象の行だけに掛かります。
type Job struct {
	ID          uint
	Type        string
	Payload     string
	Status      string `gorm:"index:idx_jobs_status_run_after,priority:1"`
	Attempts    int
	MaxAttempts int
	RunAfter    time.Time `gorm:"index:idx_jobs_status_run_after,priority:2"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
