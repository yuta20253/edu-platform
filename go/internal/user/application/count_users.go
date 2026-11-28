package application

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
)

// CountUsers は条件に一致するユーザーの人数を数えます。
// AggregateNone は人数1件を、それ以外はグループごとの人数を返します。人数が0のグループは含めません
// （Rails現行の group.count と同じ）。Deactivated が指定されていない場合は ErrDeactivatedScopeRequired を返します。
func (s *Service) CountUsers(
	ctx context.Context,
	cond SearchCondition,
	unit AggregateUnit,
) ([]CountResult, error) {
	if !validDeactivatedScope(cond.Deactivated) {
		return nil, ErrDeactivatedScopeRequired
	}

	filter, err := toUserFilter(cond)
	if err != nil {
		return nil, err
	}

	switch unit {
	case AggregateNone:
		return s.countAll(ctx, filter)
	case AggregateByRole:
		return s.countByRole(ctx, filter)
	case AggregateByHighSchool:
		return s.countByID(ctx, filter, infrastructure.CountUsersByHighSchool,
			func(id *uint) CountResult { return CountResult{HighSchoolID: id} })
	case AggregateByGrade:
		return s.countByID(ctx, filter, infrastructure.CountUsersByGrade,
			func(id *uint) CountResult { return CountResult{GradeID: id} })
	default:
		return nil, apperror.NewInternal(fmt.Errorf("未知の集計の単位です: %v", unit))
	}
}

func (s *Service) countAll(
	ctx context.Context,
	filter infrastructure.UserFilter,
) ([]CountResult, error) {
	n, err := infrastructure.CountUsers(ctx, s.db, filter)
	if err != nil {
		return nil, apperror.NewInternal(err)
	}

	return []CountResult{{Count: n}}, nil
}

func (s *Service) countByRole(
	ctx context.Context,
	filter infrastructure.UserFilter,
) ([]CountResult, error) {
	rows, err := infrastructure.CountUsersByRole(ctx, s.db, filter)
	if err != nil {
		return nil, apperror.NewInternal(err)
	}

	results := make([]CountResult, 0, len(rows))

	for _, r := range rows {
		role, roleErr := roleFromName(r.RoleName)
		if roleErr != nil {
			return nil, apperror.NewInternal(fmt.Errorf("役割別の人数を変換できません: %w", roleErr))
		}

		results = append(results, CountResult{Role: &role, Count: r.Count})
	}

	return results, nil
}

type countByIDFunc func(
	ctx context.Context,
	db *gorm.DB,
	f infrastructure.UserFilter,
) ([]infrastructure.IDCount, error)

func (s *Service) countByID(
	ctx context.Context,
	filter infrastructure.UserFilter,
	count countByIDFunc,
	newResult func(id *uint) CountResult,
) ([]CountResult, error) {
	rows, err := count(ctx, s.db, filter)
	if err != nil {
		return nil, apperror.NewInternal(err)
	}

	results := make([]CountResult, 0, len(rows))

	for _, r := range rows {
		res := newResult(r.ID)
		res.Count = r.Count
		results = append(results, res)
	}

	return results, nil
}
