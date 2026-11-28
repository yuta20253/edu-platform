// Package user はユーザー基盤（user Context）です。ユーザー情報の参照、招待経路でのアカウント作成、
// 生徒番号の発行、招待メールの送信依頼を、他Contextへの公開操作として提供します。
// HTTPエンドポイントを持たない内部専用Contextです。
package user

import (
	"context"
	"log/slog"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue"
	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue/worker"
	"github.com/yuta20253/edu-platform/go/internal/user/application"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure/mail"
)

// 公開操作の入出力の型です（application/dto.go・dependency.go の再公開）。
type (
	UserAttributes            = application.UserAttributes
	Role                      = application.Role
	SearchCondition           = application.SearchCondition
	DeactivatedScope          = application.DeactivatedScope
	AggregateUnit             = application.AggregateUnit
	CountResult               = application.CountResult
	CreateStudentAccountInput = application.CreateStudentAccountInput
	CreateTeacherAccountInput = application.CreateTeacherAccountInput
	CreateAdminAccountInput   = application.CreateAdminAccountInput
	TokenIssuer               = application.TokenIssuer
	SchoolCodeReader          = application.SchoolCodeReader
	DeliveryMode              = application.DeliveryMode
	InvitationResult          = application.InvitationResult
)

// 公開操作の定数です（application/dto.go の再公開）。
const (
	RoleAdmin    = application.RoleAdmin
	RoleStudent  = application.RoleStudent
	RoleTeacher  = application.RoleTeacher
	RoleGuardian = application.RoleGuardian

	ActiveOnly         = application.ActiveOnly
	IncludeDeactivated = application.IncludeDeactivated

	AggregateNone         = application.AggregateNone
	AggregateByRole       = application.AggregateByRole
	AggregateByHighSchool = application.AggregateByHighSchool
	AggregateByGrade      = application.AggregateByGrade

	DeliveryEnqueue   = application.DeliveryEnqueue
	DeliveryImmediate = application.DeliveryImmediate

	InvitationSent    = application.InvitationSent
	InvitationFailed  = application.InvitationFailed
	InvitationSkipped = application.InvitationSkipped
)

// InvitationEmailJobType は招待メール送信ジョブの種別です。main.go がハンドラの登録に使います。
const InvitationEmailJobType = infrastructure.InvitationEmailJobType

// Context は他Contextへ公開する操作の入口です。HTTPのHandlerを持ちません。
type Context struct {
	svc *application.Service
}

// NewContext は依存関係を組み立てます。JobPublisher は worker.NewPublisher(db) から、
// Mailer は frontendURL と何も送らない NopSender から組み立てます（メールの実送信は行いません）。
// 他Contextへの依存（TokenIssuer・SchoolCodeReader）は、相手Contextの実装が未完のため引数で受け取ります。
func NewContext(
	db *gorm.DB,
	logger *slog.Logger,
	tokenIssuer TokenIssuer,
	schoolCodeReader SchoolCodeReader,
	frontendURL string,
) *Context {
	svc := application.NewService(db, logger, worker.NewPublisher(db),
		tokenIssuer, schoolCodeReader, newMailer(frontendURL))

	return &Context{svc: svc}
}

// newMailer は招待メールの Mailer を組み立てます。送信は何も送らない NopSender に委ねます。
func newMailer(frontendURL string) application.Mailer {
	return mail.NewInvitationMailer(frontendURL, mail.NopSender{})
}

// InvitationEmailHandler は招待メール送信ジョブ（種別 user_invitation_email）のハンドラを返します。
// main.go が jobqueue.HandlerMap へ登録します。
func (c *Context) InvitationEmailHandler() jobqueue.Handler {
	return c.svc.HandleInvitationEmailJob
}

// GetUserAttributes は指定したユーザーの基本属性を取得します。
func (c *Context) GetUserAttributes(ctx context.Context, userIDs []uint) ([]UserAttributes, error) {
	return c.svc.GetUserAttributes(ctx, userIDs)
}

// FindUserByEmail はメールアドレスに一致するユーザーを1件取得します。
func (c *Context) FindUserByEmail(
	ctx context.Context,
	email string,
) (attrs UserAttributes, found bool, err error) {
	return c.svc.FindUserByEmail(ctx, email)
}

// SearchUsers は条件に一致するユーザーの一覧を ID 昇順で取得します。
func (c *Context) SearchUsers(ctx context.Context, cond SearchCondition) ([]UserAttributes, error) {
	return c.svc.SearchUsers(ctx, cond)
}

// CountUsers は条件に一致するユーザーの人数を数えます。
func (c *Context) CountUsers(
	ctx context.Context,
	cond SearchCondition,
	unit AggregateUnit,
) ([]CountResult, error) {
	return c.svc.CountUsers(ctx, cond, unit)
}

// CreateStudentAccount は生徒アカウント本体を作成し、招待メールの送信を依頼します。
func (c *Context) CreateStudentAccount(
	ctx context.Context,
	in CreateStudentAccountInput,
) (UserAttributes, error) {
	return c.svc.CreateStudentAccount(ctx, in)
}

// CreateTeacherAccount は教員アカウント本体を、指定された初期状態で作成します。
func (c *Context) CreateTeacherAccount(
	ctx context.Context,
	in CreateTeacherAccountInput,
) (UserAttributes, error) {
	return c.svc.CreateTeacherAccount(ctx, in)
}

// CreateAdminAccount は管理者アカウント本体を、招待待ちで作成し招待メールの送信を依頼します。
func (c *Context) CreateAdminAccount(
	ctx context.Context,
	in CreateAdminAccountInput,
) (UserAttributes, error) {
	return c.svc.CreateAdminAccount(ctx, in)
}

// IssueStudentNumber は生徒に一意の生徒番号を割り当てます。
func (c *Context) IssueStudentNumber(ctx context.Context, highSchoolID uint) (string, error) {
	return c.svc.IssueStudentNumber(ctx, highSchoolID)
}

// RequestInvitationEmail は指定したユーザーへ招待メールを送ります。
func (c *Context) RequestInvitationEmail(
	ctx context.Context,
	userID uint,
	mode DeliveryMode,
) (InvitationResult, error) {
	return c.svc.RequestInvitationEmail(ctx, userID, mode)
}
