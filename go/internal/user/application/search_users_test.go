package application

import (
	"errors"
	"net/http"
	"reflect"
	"testing"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

// searchFixture は検索・集計のテストで使うユーザーです。
type searchFixture struct {
	refs        testRefs
	student1    uint // 生徒・A高校1年1組・招待待ち
	student2    uint // 生徒・A高校2年・招待完了
	teacher     uint // 教員・A高校1年・招待完了
	deactivated uint // 生徒・B高校1年・無効化済み
	admin       uint // 管理者・所属なし
}

func setupSearchFixture(t *testing.T) (testDeps, searchFixture) {
	t.Helper()

	db, refs := setupTestDB(t)
	f := searchFixture{refs: refs}

	f.student1 = mustInsertUser(t, db, userSeed{email: "s1@example.com", roleID: refs.roleIDs[1],
		highSchoolID: ptr(refs.highSchoolA), gradeID: ptr(refs.gradeA1),
		schoolClassID: ptr(refs.classA1), pending: true})
	f.student2 = mustInsertUser(t, db, userSeed{email: "s2@example.com", roleID: refs.roleIDs[1],
		highSchoolID: ptr(refs.highSchoolA), gradeID: ptr(refs.gradeA2)})
	f.teacher = mustInsertUser(t, db, userSeed{email: "t@example.com", roleID: refs.roleIDs[2],
		highSchoolID: ptr(refs.highSchoolA), gradeID: ptr(refs.gradeA1)})
	f.deactivated = mustInsertUser(t, db, userSeed{email: "d@example.com", roleID: refs.roleIDs[1],
		highSchoolID: ptr(refs.highSchoolB), gradeID: ptr(refs.gradeB1), deactivated: true})
	f.admin = mustInsertUser(t, db, userSeed{email: "a@example.com", roleID: refs.roleIDs[0]})

	return newTestService(db, refs), f
}

func attrIDs(attrs []UserAttributes) []uint {
	ids := make([]uint, 0, len(attrs))
	for _, a := range attrs {
		ids = append(ids, a.ID)
	}

	return ids
}

func TestService_SearchUsers_Guard(t *testing.T) {
	d, f := setupSearchFixture(t)

	tests := []struct {
		name    string
		cond    SearchCondition
		wantErr error
	}{
		{"Deactivated未指定はエラー", SearchCondition{IDs: []uint{f.admin}}, ErrDeactivatedScopeRequired},
		{"絞り込み条件なしはエラー", SearchCondition{Deactivated: ActiveOnly}, ErrSearchConditionRequired},
		{"招待完了状態のみの指定はエラー", SearchCondition{InvitationCompleted: ptr(true),
			Deactivated: ActiveOnly}, ErrSearchConditionRequired},
		{"除外IDのみの指定はエラー", SearchCondition{ExcludeIDs: []uint{f.admin},
			Deactivated: IncludeDeactivated}, ErrSearchConditionRequired},
		{"空のスライスは指定に数えない", SearchCondition{IDs: []uint{}, Roles: []Role{},
			Deactivated: ActiveOnly}, ErrSearchConditionRequired},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := d.svc.SearchUsers(t.Context(), tt.cond); !errors.Is(err, tt.wantErr) {
				t.Errorf("SearchUsers() error = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

type searchUsersCase struct {
	name string
	cond SearchCondition
	want []uint
}

func searchUsersCases(f searchFixture) []searchUsersCase {
	r := f.refs

	return []searchUsersCase{
		{"役割で絞り込む", SearchCondition{Roles: []Role{RoleStudent}, Deactivated: ActiveOnly},
			[]uint{f.student1, f.student2}},
		{"無効化済みを含む", SearchCondition{Roles: []Role{RoleStudent}, Deactivated: IncludeDeactivated},
			[]uint{f.student1, f.student2, f.deactivated}},
		{"所属校で絞り込む", SearchCondition{HighSchoolIDs: []uint{r.highSchoolA}, Deactivated: ActiveOnly},
			[]uint{f.student1, f.student2, f.teacher}},
		{"学年の複数指定", SearchCondition{GradeIDs: []uint{r.gradeA1, r.gradeA2}, Deactivated: ActiveOnly},
			[]uint{f.student1, f.student2, f.teacher}},
		{"クラスで絞り込む", SearchCondition{SchoolClassID: ptr(r.classA1), Deactivated: ActiveOnly},
			[]uint{f.student1}},
		{"招待完了と除外IDを組み合わせる", SearchCondition{HighSchoolIDs: []uint{r.highSchoolA},
			InvitationCompleted: ptr(true), ExcludeIDs: []uint{f.teacher}, Deactivated: ActiveOnly},
			[]uint{f.student2}},
		{"ID昇順で返す", SearchCondition{IDs: []uint{f.admin, f.teacher, f.student1},
			Deactivated: ActiveOnly}, []uint{f.student1, f.teacher, f.admin}},
		{"該当なしは空", SearchCondition{IDs: []uint{99999999}, Deactivated: ActiveOnly}, []uint{}},
	}
}

func TestService_SearchUsers(t *testing.T) {
	d, f := setupSearchFixture(t)

	for _, tt := range searchUsersCases(f) {
		t.Run(tt.name, func(t *testing.T) {
			got, err := d.svc.SearchUsers(t.Context(), tt.cond)
			if err != nil {
				t.Fatalf("SearchUsers() error = %v, want nil", err)
			}

			if ids := attrIDs(got); !reflect.DeepEqual(ids, tt.want) {
				t.Errorf("IDs = %v, want %v", ids, tt.want)
			}
		})
	}
}

func TestService_SearchUsers_UnknownRole(t *testing.T) {
	d, _ := setupSearchFixture(t)

	_, err := d.svc.SearchUsers(t.Context(),
		SearchCondition{Roles: []Role{"unknown"}, Deactivated: ActiveOnly})

	var appErr apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode() != http.StatusInternalServerError {
		t.Errorf("SearchUsers() error = %v, want 内部エラー（未知の役割）", err)
	}
}
