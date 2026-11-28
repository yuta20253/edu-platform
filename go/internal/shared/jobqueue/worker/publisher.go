package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue"
	"github.com/yuta20253/edu-platform/go/internal/shared/transaction/gormtx"
)

type publisher struct {
	db *gorm.DB
}

// NewPublisher は jobs テーブルへジョブを登録する JobPublisher を返します。
func NewPublisher(db *gorm.DB) jobqueue.JobPublisher {
	return &publisher{db: db}
}

// Publish はジョブを jobs テーブルへ登録します。
// ctx にトランザクションがあればそれに参加し、業務データの書き込みと同一トランザクションで登録します。
func (p *publisher) Publish(
	ctx context.Context,
	jobType string,
	payload any,
	runAfter time.Time,
) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("ジョブのpayloadのJSON変換に失敗しました: %w", err)
	}

	job := Job{
		Type:        jobType,
		Payload:     string(body),
		Status:      StatusPending,
		MaxAttempts: DefaultMaxAttempts,
		RunAfter:    runAfter,
	}

	if err := gormtx.DBFromContext(ctx, p.db).Create(&job).Error; err != nil {
		return fmt.Errorf("ジョブの登録に失敗しました: %w", err)
	}

	return nil
}
