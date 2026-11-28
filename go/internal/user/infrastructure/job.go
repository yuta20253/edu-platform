package infrastructure

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue"
)

// InvitationEmailJobType は招待メール送信依頼のジョブ種別です。
const InvitationEmailJobType = "user_invitation_email"

// invitationEmailPayload は招待メール送信依頼の payload です。
// パスワード設定用トークンは含めません（ジョブの実行時に発行します）。
type invitationEmailPayload struct {
	UserID uint `json:"user_id"`
}

// enqueueInvitationEmail は招待メール送信依頼を jobs へ登録します。
// ctx にトランザクションがあればそれに参加します（JobPublisher の実装による）。
func enqueueInvitationEmail(
	ctx context.Context,
	publisher jobqueue.JobPublisher,
	userID uint,
) error {
	err := publisher.Publish(ctx, InvitationEmailJobType,
		invitationEmailPayload{UserID: userID}, time.Now())
	if err != nil {
		return fmt.Errorf("招待メール送信依頼の登録に失敗しました: %w", err)
	}

	return nil
}

// EnqueueInvitationEmail は作成操作を伴わない招待メールの送信依頼（登録方式）で、
// 招待メール送信依頼を jobs へ登録します。
func EnqueueInvitationEmail(
	ctx context.Context,
	publisher jobqueue.JobPublisher,
	userID uint,
) error {
	return enqueueInvitationEmail(ctx, publisher, userID)
}

// DecodeInvitationEmailPayload は招待メール送信依頼の payload からユーザーIDを取り出します。
func DecodeInvitationEmailPayload(payload []byte) (uint, error) {
	var p invitationEmailPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return 0, fmt.Errorf("招待メール送信依頼のpayloadの解析に失敗しました: %w", err)
	}

	if p.UserID == 0 {
		return 0, errors.New("招待メール送信依頼のpayloadにユーザーIDがありません")
	}

	return p.UserID, nil
}
