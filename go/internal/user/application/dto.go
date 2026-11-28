// Package application は user Context の公開操作（Transaction Script）を実装します。
// Service が依存を保持し、公開操作を1操作1メソッドとして持ちます。
package application

//go:generate go run golang.org/x/tools/cmd/stringer@v0.39.0 -type=DeactivatedScope,AggregateUnit,DeliveryMode,InvitationResult -output=dto_string.go

// Role はユーザーの役割です。値は user_roles.name のenum名と同じ文字列です
// （Rails現行のenum: admin=0 / student=1 / teacher=2 / guardian=3）。
type Role string

// 役割です。
const (
	RoleAdmin    Role = "admin"
	RoleStudent  Role = "student"
	RoleTeacher  Role = "teacher"
	RoleGuardian Role = "guardian"
)

// UserAttributes は本Contextが公開するユーザーの基本属性です。
type UserAttributes struct {
	ID            uint
	Email         string
	Name          string
	NameKana      string
	Role          Role
	HighSchoolID  *uint
	GradeID       *uint
	SchoolClassID *uint
	StudentNumber *string
	// InvitationCompleted は password_reset_required が偽であることを表します。
	InvitationCompleted bool
	// Deactivated は deleted_at が設定されていることを表します。
	Deactivated bool
}

// DeactivatedScope は無効化済みユーザーの扱いです。
// 指定の欠落を検出できるよう、ゼロ値を割り当てません。
type DeactivatedScope int

// 無効化済みユーザーの扱いです。
const (
	ActiveOnly         DeactivatedScope = iota + 1 // 有効のみ
	IncludeDeactivated                             // 無効化済みを含む
)

// SearchCondition はユーザーの検索・集計の条件です。
// IDs・Roles・HighSchoolIDs・GradeIDs・SchoolClassID を絞り込み条件とします。
type SearchCondition struct {
	IDs                 []uint
	Roles               []Role
	HighSchoolIDs       []uint
	GradeIDs            []uint
	SchoolClassID       *uint
	InvitationCompleted *bool
	ExcludeIDs          []uint
	Deactivated         DeactivatedScope // 必須
}

// AggregateUnit は人数集計の単位です。
type AggregateUnit int

// 人数集計の単位です。
const (
	AggregateNone AggregateUnit = iota + 1
	AggregateByRole
	AggregateByHighSchool
	AggregateByGrade
)

// CountResult は集計の1グループです。集計の単位に対応するフィールドだけが設定され、他は nil です。
//   - AggregateNone: すべて nil（人数のみ）
//   - AggregateByRole: Role
//   - AggregateByHighSchool: HighSchoolID
//   - AggregateByGrade: GradeID
type CountResult struct {
	Role         *Role
	HighSchoolID *uint
	GradeID      *uint
	Count        int64
}

// CreateStudentAccountInput は生徒アカウントの作成の入力です。
type CreateStudentAccountInput struct {
	Name          string
	NameKana      string
	Email         string
	HighSchoolID  uint
	GradeID       uint
	SchoolClassID *uint // 任意
}

// CreateTeacherAccountInput は教員アカウントの作成の入力です。
type CreateTeacherAccountInput struct {
	Name         string
	NameKana     string
	Email        string
	HighSchoolID uint
	GradeID      *uint // 任意
	// PendingInvitation は招待待ち状態で作成するかです。
	PendingInvitation *bool // 必須（nil はエラー）
	// SendInvitationEmail は作成時に招待メールの送信を依頼するかです。
	SendInvitationEmail *bool // 必須（nil はエラー）
}

// CreateAdminAccountInput は管理者アカウントの作成の入力です。
type CreateAdminAccountInput struct {
	Name  string // 任意
	Email string
}

// DeliveryMode は招待メールの実行方式です。既定値を持たせず、必ず指定させます。
type DeliveryMode int

// 招待メールの実行方式です。
const (
	// DeliveryEnqueue は jobs へ依頼を登録し、送信をワーカーに任せる方式です。
	// 呼び出し側のトランザクションに参加し、ロールバック時は依頼も取り消されます。
	DeliveryEnqueue DeliveryMode = iota + 1
	// DeliveryImmediate はその場で送信し、結果を返す方式です。
	// 呼び出し側のトランザクションの外で呼びます。
	DeliveryImmediate
)

// InvitationResult は即時方式の送信結果です。送信失敗はエラーではなく結果として返します。
type InvitationResult int

// 招待メールの送信結果です。
const (
	InvitationSent    InvitationResult = iota + 1 // 送信成功
	InvitationFailed                              // 送信失敗（トークン発行またはメール送信基盤の失敗）
	InvitationSkipped                             // 送信対象外（対象が存在しない、または無効化済み）
)
