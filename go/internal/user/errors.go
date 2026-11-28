package user

import "github.com/yuta20253/edu-platform/go/internal/user/application"

// 本Contextが返すエラーです（application/errors.go の再公開）。errors.Is で判定します。
var (
	ErrLookupEmailRequired         = application.ErrLookupEmailRequired
	ErrUserIDsRequired             = application.ErrUserIDsRequired
	ErrUserIDRequired              = application.ErrUserIDRequired
	ErrSearchConditionRequired     = application.ErrSearchConditionRequired
	ErrDeactivatedScopeRequired    = application.ErrDeactivatedScopeRequired
	ErrDeliveryModeRequired        = application.ErrDeliveryModeRequired
	ErrPendingInvitationRequired   = application.ErrPendingInvitationRequired
	ErrSendInvitationEmailRequired = application.ErrSendInvitationEmailRequired
)

// IsEmailAlreadyUsed は err がメールアドレスの使用済み（email の taken）を含むかを返します。
func IsEmailAlreadyUsed(err error) bool {
	return application.IsEmailAlreadyUsed(err)
}
