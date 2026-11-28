package application

import "context"

// TokenIssuer は authentication が公開するパスワード設定用トークンの発行操作です。
// トークンの状態遷移（発行・期限・消費）は authentication が所有します。
type TokenIssuer interface {
	IssueInvitationToken(ctx context.Context, userID uint) (rawToken string, err error)
}

// SchoolCodeReader は master-data が公開する高校の学校コードの取得操作です。
// 生徒番号の発行に使います。高校が存在しない、または学校コードが未設定の場合は error を返します。
type SchoolCodeReader interface {
	FindSchoolCode(ctx context.Context, highSchoolID uint) (string, error)
}

// Mailer は招待メールの送信基盤です。
type Mailer interface {
	SendInvitationEmail(ctx context.Context, to string, rawToken string) error
}
