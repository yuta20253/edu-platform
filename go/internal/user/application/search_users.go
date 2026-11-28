package application

import (
	"context"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
)

// SearchUsers は条件に一致するユーザーの一覧を ID 昇順で取得します。ページネーションは行いません。
// Deactivated が指定されていない場合は ErrDeactivatedScopeRequired、
// 絞り込み条件（IDs・Roles・HighSchoolIDs・GradeIDs・SchoolClassID）がいずれも無い場合は
// ErrSearchConditionRequired を返します（InvitationCompleted・ExcludeIDs は数えません）。
func (s *Service) SearchUsers(ctx context.Context, cond SearchCondition) ([]UserAttributes, error) {
	if !validDeactivatedScope(cond.Deactivated) {
		return nil, ErrDeactivatedScopeRequired
	}

	if !hasNarrowingCondition(cond) {
		return nil, ErrSearchConditionRequired
	}

	filter, err := toUserFilter(cond)
	if err != nil {
		return nil, err
	}

	rows, err := infrastructure.SearchUsers(ctx, s.db, filter)
	if err != nil {
		return nil, apperror.NewInternal(err)
	}

	return toUserAttributesList(rows)
}

func validDeactivatedScope(d DeactivatedScope) bool {
	return d == ActiveOnly || d == IncludeDeactivated
}

func hasNarrowingCondition(cond SearchCondition) bool {
	return len(cond.IDs) > 0 || len(cond.Roles) > 0 || len(cond.HighSchoolIDs) > 0 ||
		len(cond.GradeIDs) > 0 || cond.SchoolClassID != nil
}

// toUserFilter は検索条件を infrastructure の条件へ変換します。役割は user_roles.name の整数へ戻します。
func toUserFilter(cond SearchCondition) (infrastructure.UserFilter, error) {
	roleNames := make([]int32, 0, len(cond.Roles))

	for _, r := range cond.Roles {
		n, err := roleToName(r)
		if err != nil {
			return infrastructure.UserFilter{}, apperror.NewInternal(err)
		}

		roleNames = append(roleNames, n)
	}

	return infrastructure.UserFilter{
		IDs:                 cond.IDs,
		RoleNames:           roleNames,
		HighSchoolIDs:       cond.HighSchoolIDs,
		GradeIDs:            cond.GradeIDs,
		SchoolClassID:       cond.SchoolClassID,
		InvitationCompleted: cond.InvitationCompleted,
		ExcludeIDs:          cond.ExcludeIDs,
		IncludeDeactivated:  cond.Deactivated == IncludeDeactivated,
	}, nil
}
