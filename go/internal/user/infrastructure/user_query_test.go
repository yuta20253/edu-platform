package infrastructure

import (
	"reflect"
	"testing"
	"time"

	"gorm.io/gorm"
)

// queryFixture は参照のテストで使うユーザーです。
type queryFixture struct {
	refs testRefs
	// 生徒・A高校1年1組・招待待ち・有効
	student1 userModel
	// 生徒・A高校2年・招待完了・有効
	student2 userModel
	// 教員・A高校1年・招待完了・有効
	teacher userModel
	// 生徒・B高校1年・招待完了・無効化済み
	deactivated userModel
	// 管理者・所属なし・招待待ち・有効
	admin userModel
	// 保護者・所属なし・招待完了・有効
	guardian userModel
}

func setupQueryFixture(t *testing.T) (*gorm.DB, queryFixture) {
	t.Helper()

	db, refs := setupTestDB(t)
	deletedAt := time.Now().UTC().Truncate(time.Second)

	f := queryFixture{refs: refs}
	f.student1 = mustCreateUser(t, db, userModel{
		Email: "student1@example.com", Name: ptr("生徒1"), NameKana: ptr("セイト1"),
		UserRoleID: ptr(refs.roleIDs[1]), HighSchoolID: ptr(refs.highSchoolA),
		GradeID: ptr(refs.gradeA1), SchoolClassID: ptr(refs.classA1),
		StudentNumber: ptr("A-AAAA0001"), PasswordResetRequired: true,
	})
	f.student2 = mustCreateUser(t, db, userModel{
		Email: "student2@example.com", UserRoleID: ptr(refs.roleIDs[1]),
		HighSchoolID: ptr(refs.highSchoolA), GradeID: ptr(refs.gradeA2),
	})
	f.teacher = mustCreateUser(t, db, userModel{
		Email: "teacher@example.com", UserRoleID: ptr(refs.roleIDs[2]),
		HighSchoolID: ptr(refs.highSchoolA), GradeID: ptr(refs.gradeA1),
	})
	f.deactivated = mustCreateUser(t, db, userModel{
		Email: "deactivated@example.com", UserRoleID: ptr(refs.roleIDs[1]),
		HighSchoolID: ptr(refs.highSchoolB), GradeID: ptr(refs.gradeB1),
		StudentNumber: ptr("B-BBBB0001"), DeletedAt: &deletedAt,
	})
	f.admin = mustCreateUser(t, db, userModel{
		Email: "admin@example.com", UserRoleID: ptr(refs.roleIDs[0]), PasswordResetRequired: true,
	})
	f.guardian = mustCreateUser(t, db, userModel{
		Email: "guardian@example.com", UserRoleID: ptr(refs.roleIDs[3]),
	})

	return db, f
}

func rowIDs(rows []UserRow) []uint {
	ids := make([]uint, 0, len(rows))
	for _, r := range rows {
		ids = append(ids, r.ID)
	}

	return ids
}

func TestFindUsersByIDs(t *testing.T) {
	db, f := setupQueryFixture(t)

	rows, err := FindUsersByIDs(t.Context(), db, []uint{f.deactivated.ID, f.student1.ID, 99999999})
	if err != nil {
		t.Fatalf("FindUsersByIDs() error = %v, want nil", err)
	}

	got, wantIDs := rowIDs(rows), []uint{f.student1.ID, f.deactivated.ID}
	if !reflect.DeepEqual(got, wantIDs) {
		t.Fatalf("IDs = %v, want %v（存在しないIDは含めず、無効化済みは含める）", got, wantIDs)
	}

	want := UserRow{
		ID: f.student1.ID, Email: "student1@example.com", Name: ptr("生徒1"), NameKana: ptr("セイト1"),
		RoleName: ptr(int32(1)), HighSchoolID: ptr(f.refs.highSchoolA), GradeID: ptr(f.refs.gradeA1),
		SchoolClassID: ptr(f.refs.classA1), StudentNumber: ptr("A-AAAA0001"),
		PasswordResetRequired: true,
	}
	if !reflect.DeepEqual(rows[0], want) {
		t.Errorf("rows[0] = %+v, want %+v", rows[0], want)
	}

	if rows[1].DeletedAt == nil {
		t.Errorf("無効化済みのユーザーの DeletedAt = nil, want 設定あり")
	}
}

func TestFindUsersByIDs_RoleName(t *testing.T) {
	db, f := setupQueryFixture(t)

	rows, err := FindUsersByIDs(t.Context(), db,
		[]uint{f.admin.ID, f.student2.ID, f.teacher.ID, f.guardian.ID})
	if err != nil {
		t.Fatalf("FindUsersByIDs() error = %v, want nil", err)
	}

	got := map[uint]int32{}
	for _, r := range rows {
		got[r.ID] = *r.RoleName
	}

	want := map[uint]int32{f.admin.ID: 0, f.student2.ID: 1, f.teacher.ID: 2, f.guardian.ID: 3}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("役割 = %v, want %v（user_roles.name の整数のまま）", got, want)
	}
}

func TestFindUserByEmail(t *testing.T) {
	db, f := setupQueryFixture(t)

	tests := []struct {
		name      string
		email     string
		wantID    uint
		wantFound bool
	}{
		{name: "一致するユーザーを返す", email: "student1@example.com",
			wantID: f.student1.ID, wantFound: true},
		{name: "無効化済みのユーザーも返す", email: "deactivated@example.com",
			wantID: f.deactivated.ID, wantFound: true},
		{name: "該当しなければ見つからない", email: "none@example.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			row, found, err := FindUserByEmail(t.Context(), db, tt.email)
			if err != nil {
				t.Fatalf("FindUserByEmail() error = %v, want nil", err)
			}

			if found != tt.wantFound || row.ID != tt.wantID {
				t.Errorf("FindUserByEmail() = (id=%d, %v), want (id=%d, %v)",
					row.ID, found, tt.wantID, tt.wantFound)
			}
		})
	}
}

type searchCase struct {
	name   string
	filter UserFilter
	want   []uint
}

func searchCases(f queryFixture) []searchCase {
	r := f.refs

	return []searchCase{
		{"役割で絞り込み有効のみ", UserFilter{RoleNames: []int32{1}},
			[]uint{f.student1.ID, f.student2.ID}},
		{"無効化済みを含む", UserFilter{RoleNames: []int32{1}, IncludeDeactivated: true},
			[]uint{f.student1.ID, f.student2.ID, f.deactivated.ID}},
		{"所属校で絞り込む", UserFilter{HighSchoolIDs: []uint{r.highSchoolA}},
			[]uint{f.student1.ID, f.student2.ID, f.teacher.ID}},
		{"学年の複数指定", UserFilter{GradeIDs: []uint{r.gradeA1, r.gradeB1}, IncludeDeactivated: true},
			[]uint{f.student1.ID, f.teacher.ID, f.deactivated.ID}},
		{"クラスで絞り込む", UserFilter{SchoolClassID: ptr(r.classA1)}, []uint{f.student1.ID}},
		{"招待完了のみ", UserFilter{HighSchoolIDs: []uint{r.highSchoolA}, InvitationCompleted: ptr(true)},
			[]uint{f.student2.ID, f.teacher.ID}},
		{"招待待ちのみ", UserFilter{HighSchoolIDs: []uint{r.highSchoolA}, InvitationCompleted: ptr(false)},
			[]uint{f.student1.ID}},
		{"除外IDを除く", UserFilter{HighSchoolIDs: []uint{r.highSchoolA}, ExcludeIDs: []uint{f.student1.ID}},
			[]uint{f.student2.ID, f.teacher.ID}},
		{"ID指定はID昇順で返す", UserFilter{IDs: []uint{f.admin.ID, f.student1.ID}},
			[]uint{f.student1.ID, f.admin.ID}},
		{"該当なしは空", UserFilter{IDs: []uint{99999999}}, []uint{}},
	}
}

func TestSearchUsers(t *testing.T) {
	db, f := setupQueryFixture(t)

	for _, tt := range searchCases(f) {
		t.Run(tt.name, func(t *testing.T) {
			rows, err := SearchUsers(t.Context(), db, tt.filter)
			if err != nil {
				t.Fatalf("SearchUsers() error = %v, want nil", err)
			}

			if got := rowIDs(rows); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("IDs = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCountUsers(t *testing.T) {
	db, f := setupQueryFixture(t)

	tests := []struct {
		name   string
		filter UserFilter
		want   int64
	}{
		{"条件に一致する人数", UserFilter{HighSchoolIDs: []uint{f.refs.highSchoolA}}, 3},
		{"無効化済みを含む人数", UserFilter{RoleNames: []int32{1}, IncludeDeactivated: true}, 3},
		{"該当なしは0", UserFilter{IDs: []uint{99999999}}, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := CountUsers(t.Context(), db, tt.filter)
			if err != nil {
				t.Fatalf("CountUsers() error = %v, want nil", err)
			}

			if got != tt.want {
				t.Errorf("CountUsers() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestCountUsersByRole(t *testing.T) {
	db, f := setupQueryFixture(t)

	got, err := CountUsersByRole(t.Context(), db,
		UserFilter{HighSchoolIDs: []uint{f.refs.highSchoolA}})
	if err != nil {
		t.Fatalf("CountUsersByRole() error = %v, want nil", err)
	}

	// 人数0の役割（管理者・保護者）は含めない
	want := []RoleCount{{RoleName: ptr(int32(1)), Count: 2}, {RoleName: ptr(int32(2)), Count: 1}}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("CountUsersByRole() = %+v, want %+v", got, want)
	}
}

func TestCountUsersByHighSchool(t *testing.T) {
	db, f := setupQueryFixture(t)
	r := f.refs

	got, err := CountUsersByHighSchool(t.Context(), db,
		UserFilter{HighSchoolIDs: []uint{r.highSchoolA, r.highSchoolB}})
	if err != nil {
		t.Fatalf("CountUsersByHighSchool() error = %v, want nil", err)
	}

	// B高校は無効化済みのユーザーのみのため含めない
	want := []IDCount{{ID: ptr(r.highSchoolA), Count: 3}}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("CountUsersByHighSchool() = %+v, want %+v", got, want)
	}
}

func TestCountUsersByGrade(t *testing.T) {
	db, f := setupQueryFixture(t)
	r := f.refs

	got, err := CountUsersByGrade(t.Context(), db,
		UserFilter{GradeIDs: []uint{r.gradeA1, r.gradeA2, r.gradeB1}})
	if err != nil {
		t.Fatalf("CountUsersByGrade() error = %v, want nil", err)
	}

	want := []IDCount{{ID: ptr(r.gradeA1), Count: 2}, {ID: ptr(r.gradeA2), Count: 1}}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("CountUsersByGrade() = %+v, want %+v", got, want)
	}
}

func TestStudentNumberExists(t *testing.T) {
	db, _ := setupQueryFixture(t)

	tests := []struct {
		name   string
		number string
		want   bool
	}{
		{"使用中の生徒番号は存在する", "A-AAAA0001", true},
		{"無効化済みのユーザーの生徒番号も存在する", "B-BBBB0001", true},
		{"未使用の生徒番号は存在しない", "A-ZZZZ9999", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := StudentNumberExists(t.Context(), db, tt.number)
			if err != nil {
				t.Fatalf("StudentNumberExists() error = %v, want nil", err)
			}

			if got != tt.want {
				t.Errorf("StudentNumberExists(%q) = %v, want %v", tt.number, got, tt.want)
			}
		})
	}
}
