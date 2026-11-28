// Package infrastructure は user Context のDBアクセスと、招待メール送信依頼のジョブ登録を提供します。
// application をimportしません（Service が本パッケージの関数を直接呼ぶため）。
package infrastructure

import "time"

// userModel は users テーブルの1行です（Rails db/schema.rb のカラムに合わせます）。
// 本Contextは users の削除操作を持たず、他の経路で論理削除された行も参照するため、
// deleted_at は gorm.DeletedAt ではなく *time.Time とします（Gorm規約「論理削除」）。
type userModel struct {
	ID            uint    `gorm:"primaryKey;type:bigint"`
	Email         string  `gorm:"size:255;not null;uniqueIndex:index_users_on_email"`
	JTI           string  `gorm:"column:jti;size:255;not null;uniqueIndex:index_users_on_jti"`
	StudentNumber *string `gorm:"size:255;uniqueIndex:index_users_on_student_number"`

	// パスワード・ログイン状態の列（authentication が更新します）
	EncryptedPassword   string     `gorm:"size:255;not null"`
	ResetPasswordToken  *string    `gorm:"size:255;uniqueIndex:index_users_on_reset_password_token"`
	ResetPasswordSentAt *time.Time `gorm:"type:datetime(6)"`
	RememberCreatedAt   *time.Time `gorm:"type:datetime(6)"`

	Name                  *string    `gorm:"size:100"`
	NameKana              *string    `gorm:"size:100"`
	UserRoleID            *uint      `gorm:"type:bigint"`
	HighSchoolID          *uint      `gorm:"type:bigint"`
	AddressID             *uint      `gorm:"type:bigint"`
	GradeID               *uint      `gorm:"type:bigint"`
	SchoolClassID         *uint      `gorm:"type:bigint"`
	PasswordResetRequired bool       `gorm:"not null;default:false"`
	ActivatedAt           *time.Time `gorm:"type:datetime(6)"`
	DeletedAt             *time.Time `gorm:"type:datetime(6)"`
	CreatedAt             time.Time  `gorm:"type:datetime(6);not null"`
	UpdatedAt             time.Time  `gorm:"type:datetime(6);not null"`
}

// TableName はテーブル名を返します。
func (userModel) TableName() string { return "users" }

// userRoleModel は user_roles テーブルの1行です。Name はRails現行のenumの整数
// （admin=0 / student=1 / teacher=2 / guardian=3）です。
type userRoleModel struct {
	ID        uint      `gorm:"primaryKey;type:bigint"`
	Name      int32     `gorm:"not null;default:1;uniqueIndex:index_user_roles_on_name"`
	CreatedAt time.Time `gorm:"type:datetime(6);not null"`
	UpdatedAt time.Time `gorm:"type:datetime(6);not null"`
}

// TableName はテーブル名を返します。
func (userRoleModel) TableName() string { return "user_roles" }
