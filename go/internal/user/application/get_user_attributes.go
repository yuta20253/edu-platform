package application

import (
	"context"
	"errors"
	"fmt"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
)

// roleNames は Role と user_roles.name の整数（Rails現行のenum）の対応です。
var roleNames = map[Role]int32{
	RoleAdmin:    0,
	RoleStudent:  1,
	RoleTeacher:  2,
	RoleGuardian: 3,
}

// GetUserAttributes は指定したユーザーの基本属性をID昇順で取得します。
// 見つからないIDは結果に含めません。無効化済みのユーザーも返します。
// userIDs が空の場合は ErrUserIDsRequired を返します。
func (s *Service) GetUserAttributes(ctx context.Context, userIDs []uint) ([]UserAttributes, error) {
	if len(userIDs) == 0 {
		return nil, ErrUserIDsRequired
	}

	rows, err := infrastructure.FindUsersByIDs(ctx, s.db, userIDs)
	if err != nil {
		return nil, apperror.NewInternal(err)
	}

	return toUserAttributesList(rows)
}

func toUserAttributesList(rows []infrastructure.UserRow) ([]UserAttributes, error) {
	attrs := make([]UserAttributes, 0, len(rows))

	for _, r := range rows {
		a, err := toUserAttributes(r)
		if err != nil {
			return nil, err
		}

		attrs = append(attrs, a)
	}

	return attrs, nil
}

// toUserAttributes は参照結果の行を UserAttributes へ変換します。
// 役割が未知（0〜3以外・未設定）の場合は内部エラーを返し、Role を空のまま返しません。
func toUserAttributes(r infrastructure.UserRow) (UserAttributes, error) {
	role, err := roleFromName(r.RoleName)
	if err != nil {
		return UserAttributes{}, apperror.NewInternal(
			fmt.Errorf("ユーザー(id=%d)の役割を変換できません: %w", r.ID, err))
	}

	return UserAttributes{
		ID:                  r.ID,
		Email:               r.Email,
		Name:                derefString(r.Name),
		NameKana:            derefString(r.NameKana),
		Role:                role,
		HighSchoolID:        r.HighSchoolID,
		GradeID:             r.GradeID,
		SchoolClassID:       r.SchoolClassID,
		StudentNumber:       r.StudentNumber,
		InvitationCompleted: !r.PasswordResetRequired,
		Deactivated:         r.DeletedAt != nil,
	}, nil
}

func roleFromName(name *int32) (Role, error) {
	if name == nil {
		return "", errors.New("役割が設定されていません")
	}

	for role, n := range roleNames {
		if n == *name {
			return role, nil
		}
	}

	return "", fmt.Errorf("未知の役割です: %d", *name)
}

func roleToName(role Role) (int32, error) {
	n, ok := roleNames[role]
	if !ok {
		return 0, fmt.Errorf("未知の役割です: %q", role)
	}

	return n, nil
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}

	return *s
}
