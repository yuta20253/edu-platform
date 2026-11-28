package application

import (
	"errors"
	"net/http"
	"reflect"
	"testing"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

type countUsersCase struct {
	name string
	cond SearchCondition
	unit AggregateUnit
	want []CountResult
}

func countUsersCases(f searchFixture) []countUsersCase {
	r := f.refs
	schoolA := SearchCondition{HighSchoolIDs: []uint{r.highSchoolA}, Deactivated: ActiveOnly}

	return []countUsersCase{
		{"集計なしは人数のみ", schoolA, AggregateNone, []CountResult{{Count: 3}}},
		{"集計なしで該当なしは人数0の1件", SearchCondition{IDs: []uint{99999999}, Deactivated: ActiveOnly},
			AggregateNone, []CountResult{{Count: 0}}},
		{"役割別は人数0の役割を含まない", schoolA, AggregateByRole, []CountResult{
			{Role: ptr(RoleStudent), Count: 2}, {Role: ptr(RoleTeacher), Count: 1}}},
		{"所属校別は人数0の所属校を含まない", SearchCondition{
			HighSchoolIDs: []uint{r.highSchoolA, r.highSchoolB}, Deactivated: ActiveOnly},
			AggregateByHighSchool, []CountResult{{HighSchoolID: ptr(r.highSchoolA), Count: 3}}},
		{"学年別は無効化済みを含めて数えられる", SearchCondition{
			GradeIDs: []uint{r.gradeA1, r.gradeA2, r.gradeB1}, Deactivated: IncludeDeactivated},
			AggregateByGrade, []CountResult{
				{GradeID: ptr(r.gradeA1), Count: 2}, {GradeID: ptr(r.gradeA2), Count: 1},
				{GradeID: ptr(r.gradeB1), Count: 1}}},
	}
}

func TestService_CountUsers(t *testing.T) {
	d, f := setupSearchFixture(t)

	for _, tt := range countUsersCases(f) {
		t.Run(tt.name, func(t *testing.T) {
			got, err := d.svc.CountUsers(t.Context(), tt.cond, tt.unit)
			if err != nil {
				t.Fatalf("CountUsers() error = %v, want nil", err)
			}

			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("CountUsers() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestService_CountUsers_Guard(t *testing.T) {
	d, f := setupSearchFixture(t)

	_, err := d.svc.CountUsers(t.Context(), SearchCondition{HighSchoolIDs: []uint{f.refs.highSchoolA}},
		AggregateNone)
	if !errors.Is(err, ErrDeactivatedScopeRequired) {
		t.Errorf("CountUsers() error = %v, want %v", err, ErrDeactivatedScopeRequired)
	}

	_, err = d.svc.CountUsers(t.Context(), SearchCondition{Deactivated: ActiveOnly}, AggregateUnit(0))

	var appErr apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode() != http.StatusInternalServerError {
		t.Errorf("CountUsers(単位未指定) error = %v, want 内部エラー", err)
	}
}
