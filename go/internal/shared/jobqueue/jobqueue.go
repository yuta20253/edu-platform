// Package jobqueue は非同期ジョブの登録と処理のためのインターフェースを提供します。
// jobs テーブルを扱う実装とワーカーは GORM に依存するため worker パッケージに置きます。
package jobqueue

import (
	"context"
	"time"
)

// JobPublisher はジョブを登録します。
// runAfter に現在時刻を渡すと即時実行相当、未来の時刻を渡すとスケジュール実行になります。
type JobPublisher interface {
	Publish(ctx context.Context, jobType string, payload any, runAfter time.Time) error
}

// Handler はジョブ1件を処理します。payload は登録時の payload を JSON にしたものです。
// 同じジョブが再試行されても結果が変わらないよう、冪等に実装します。
type Handler func(ctx context.Context, payload []byte) error

// HandlerMap はジョブの種別(type)ごとのハンドラです。
type HandlerMap map[string]Handler
