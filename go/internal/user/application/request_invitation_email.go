package application

import (
	"context"
	"fmt"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
)

// RequestInvitationEmail は指定したユーザーへ、パスワード設定用のリンクを含む招待メールを送ります。
// DeliveryEnqueue は jobs へ依頼を登録し（呼び出し側のトランザクションに参加します）、
// 戻り値の InvitationResult は意味を持ちません。DeliveryImmediate はその場で送信し結果を返します。
// 送信失敗はエラーではなく InvitationFailed として返します。
// userID が0の場合は ErrUserIDRequired、mode が未指定の場合は ErrDeliveryModeRequired を返します。
func (s *Service) RequestInvitationEmail(
	ctx context.Context,
	userID uint,
	mode DeliveryMode,
) (InvitationResult, error) {
	if userID == 0 {
		return 0, ErrUserIDRequired
	}

	switch mode {
	case DeliveryEnqueue:
		if err := infrastructure.EnqueueInvitationEmail(ctx, s.jobPublisher, userID); err != nil {
			return 0, apperror.NewInternal(err)
		}

		return 0, nil
	case DeliveryImmediate:
		result, err := s.deliverInvitation(ctx, userID)
		if result == InvitationFailed {
			// 失敗は結果として返すため、原因はここで1回だけログに残す（トークン・メールアドレスは出さない）
			s.logger.WarnContext(ctx, "failed to send invitation email",
				"user_id", userID, "error", err)

			return InvitationFailed, nil
		}

		return result, err
	default:
		return 0, ErrDeliveryModeRequired
	}
}

// HandleInvitationEmailJob は招待メール送信ジョブ（user_invitation_email）のハンドラです。
// 送信成功・送信対象外は nil（完了）、送信失敗はエラー（ワーカーによる再試行）を返します。
// トークンは実行のたびに発行し直すため、再試行されても結果が変わりません。
func (s *Service) HandleInvitationEmailJob(ctx context.Context, payload []byte) error {
	userID, err := infrastructure.DecodeInvitationEmailPayload(payload)
	if err != nil {
		return err
	}

	result, err := s.deliverInvitation(ctx, userID)

	switch result {
	case InvitationSent, InvitationSkipped:
		return nil
	case InvitationFailed:
		return fmt.Errorf("ユーザー(id=%d)への招待メールの送信に失敗しました: %w", userID, err)
	default:
		return err
	}
}

// deliverInvitation は両方式が共有する送信手順です。
//  1. ユーザーを取得し、存在しない・無効化済みなら InvitationSkipped（招待待ちかは確認しない）
//  2. TokenIssuer でトークンを発行し、失敗なら InvitationFailed
//  3. Mailer で送信し、失敗なら InvitationFailed、成功なら InvitationSent
//
// InvitationFailed のときは原因のエラーを、ユーザーの取得に失敗したときは (0, 内部エラー) を返します。
func (s *Service) deliverInvitation(ctx context.Context, userID uint) (InvitationResult, error) {
	rows, err := infrastructure.FindUsersByIDs(ctx, s.db, []uint{userID})
	if err != nil {
		return 0, apperror.NewInternal(err)
	}

	if len(rows) == 0 || rows[0].DeletedAt != nil {
		return InvitationSkipped, nil
	}

	token, err := s.tokenIssuer.IssueInvitationToken(ctx, userID)
	if err != nil {
		return InvitationFailed, fmt.Errorf("招待トークンの発行に失敗しました: %w", err)
	}

	if sendErr := s.mailer.SendInvitationEmail(ctx, rows[0].Email, token); sendErr != nil {
		return InvitationFailed, sendErr
	}

	return InvitationSent, nil
}
