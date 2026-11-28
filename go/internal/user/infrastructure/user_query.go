package infrastructure

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/transaction/gormtx"
)

// UserRow は参照結果の1行です。RoleName は user_roles.name の整数のままです
// （役割への変換は application が行います）。user_role_id が無い場合は nil です。
type UserRow struct {
	ID                    uint
	Email                 string
	Name                  *string
	NameKana              *string
	RoleName              *int32
	HighSchoolID          *uint
	GradeID               *uint
	SchoolClassID         *uint
	StudentNumber         *string
	PasswordResetRequired bool
	DeletedAt             *time.Time
}

// UserFilter は検索・集計の条件です。空のスライス・nil の項目は条件にしません。
type UserFilter struct {
	IDs                 []uint
	RoleNames           []int32
	HighSchoolIDs       []uint
	GradeIDs            []uint
	SchoolClassID       *uint
	InvitationCompleted *bool
	ExcludeIDs          []uint
	// IncludeDeactivated が偽のときは deleted_at が設定されていない行のみを対象にします。
	IncludeDeactivated bool
}

// RoleCount は役割（user_roles.name の整数）ごとの人数です。
type RoleCount struct {
	RoleName *int32
	Count    int64
}

// IDCount は所属校・学年のIDごとの人数です。
type IDCount struct {
	ID    *uint
	Count int64
}

const userColumns = "users.id, users.email, users.name, users.name_kana, " +
	"user_roles.name AS role_name, users.high_school_id, users.grade_id, users.school_class_id, " +
	"users.student_number, users.password_reset_required, users.deleted_at"

// usersQuery は users と user_roles を結合したクエリを返します。
// deleted_at の絞り込みはGORMの論理削除に頼らず、呼び出し側で明示します（Gorm規約「論理削除」）。
func usersQuery(ctx context.Context, db *gorm.DB) *gorm.DB {
	return gormtx.DBFromContext(ctx, db).Table("users").
		Joins("LEFT JOIN user_roles ON user_roles.id = users.user_role_id")
}

func applyFilter(q *gorm.DB, f UserFilter) *gorm.DB {
	if len(f.IDs) > 0 {
		q = q.Where("users.id IN ?", f.IDs)
	}

	if len(f.RoleNames) > 0 {
		q = q.Where("user_roles.name IN ?", f.RoleNames)
	}

	if len(f.HighSchoolIDs) > 0 {
		q = q.Where("users.high_school_id IN ?", f.HighSchoolIDs)
	}

	if len(f.GradeIDs) > 0 {
		q = q.Where("users.grade_id IN ?", f.GradeIDs)
	}

	if f.SchoolClassID != nil {
		q = q.Where("users.school_class_id = ?", *f.SchoolClassID)
	}

	if f.InvitationCompleted != nil {
		q = q.Where("users.password_reset_required = ?", !*f.InvitationCompleted)
	}

	if len(f.ExcludeIDs) > 0 {
		q = q.Where("users.id NOT IN ?", f.ExcludeIDs)
	}

	if !f.IncludeDeactivated {
		q = q.Where("users.deleted_at IS NULL")
	}

	return q
}

// FindUsersByIDs は指定したIDのユーザーをID昇順で返します。無効化済みも返します。
func FindUsersByIDs(ctx context.Context, db *gorm.DB, ids []uint) ([]UserRow, error) {
	return SearchUsers(ctx, db, UserFilter{IDs: ids, IncludeDeactivated: true})
}

// FindUserByEmail はメールアドレスが一致するユーザーを1件返します。無効化済みも対象です。
func FindUserByEmail(ctx context.Context, db *gorm.DB, email string) (UserRow, bool, error) {
	var rows []UserRow

	if err := usersQuery(ctx, db).Select(userColumns).
		Where("users.email = ?", email).Order("users.id").Limit(1).
		Scan(&rows).Error; err != nil {
		return UserRow{}, false, fmt.Errorf("メールアドレスによるユーザーの取得に失敗しました: %w", err)
	}

	if len(rows) == 0 {
		return UserRow{}, false, nil
	}

	return rows[0], true, nil
}

// SearchUsers は条件に一致するユーザーをID昇順で返します。
func SearchUsers(ctx context.Context, db *gorm.DB, f UserFilter) ([]UserRow, error) {
	rows := []UserRow{}

	if err := applyFilter(usersQuery(ctx, db), f).Select(userColumns).
		Order("users.id").Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("ユーザーの検索に失敗しました: %w", err)
	}

	return rows, nil
}

// CountUsers は条件に一致するユーザーの人数を返します。
func CountUsers(ctx context.Context, db *gorm.DB, f UserFilter) (int64, error) {
	var n int64

	if err := applyFilter(usersQuery(ctx, db), f).Count(&n).Error; err != nil {
		return 0, fmt.Errorf("ユーザーの人数の集計に失敗しました: %w", err)
	}

	return n, nil
}

// CountUsersByRole は役割ごとの人数を返します。人数0の役割は含みません。
func CountUsersByRole(ctx context.Context, db *gorm.DB, f UserFilter) ([]RoleCount, error) {
	rows := []RoleCount{}

	if err := applyFilter(usersQuery(ctx, db), f).
		Select("user_roles.name AS role_name, COUNT(*) AS `count`").
		Group("user_roles.name").Order("user_roles.name").Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("役割別の人数の集計に失敗しました: %w", err)
	}

	return rows, nil
}

// CountUsersByHighSchool は所属校ごとの人数を返します。人数0の所属校は含みません。
func CountUsersByHighSchool(ctx context.Context, db *gorm.DB, f UserFilter) ([]IDCount, error) {
	return countByColumn(ctx, db, f, "users.high_school_id")
}

// CountUsersByGrade は学年ごとの人数を返します。人数0の学年は含みません。
func CountUsersByGrade(ctx context.Context, db *gorm.DB, f UserFilter) ([]IDCount, error) {
	return countByColumn(ctx, db, f, "users.grade_id")
}

func countByColumn(
	ctx context.Context,
	db *gorm.DB,
	f UserFilter,
	column string,
) ([]IDCount, error) {
	rows := []IDCount{}

	if err := applyFilter(usersQuery(ctx, db), f).
		Select(column + " AS id, COUNT(*) AS `count`").
		Group(column).Order(column).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("%s ごとの人数の集計に失敗しました: %w", column, err)
	}

	return rows, nil
}

// StudentNumberExists は生徒番号が既存の全ユーザー（論理削除済みを含む）で使用済みかを返します。
func StudentNumberExists(ctx context.Context, db *gorm.DB, number string) (bool, error) {
	var n int64

	if err := gormtx.DBFromContext(ctx, db).Table("users").
		Where("student_number = ?", number).Count(&n).Error; err != nil {
		return false, fmt.Errorf("生徒番号の使用状況の確認に失敗しました: %w", err)
	}

	return n > 0, nil
}
