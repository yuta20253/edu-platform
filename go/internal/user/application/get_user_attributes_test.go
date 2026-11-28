package application

import (
	"errors"
	"net/http"
	"reflect"
	"testing"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

func TestService_GetUserAttributes_Required(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	for _, ids := range [][]uint{nil, {}} {
		if _, err := svc.GetUserAttributes(t.Context(), ids); !errors.Is(err, ErrUserIDsRequired) {
			t.Errorf("GetUserAttributes(%v) error = %v, want %v", ids, err, ErrUserIDsRequired)
		}
	}
}

func TestService_GetUserAttributes(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	student := mustInsertUser(t, db, userSeed{
		email: "student@example.com", name: ptr("生徒"), nameKana: ptr("セイト"),
		roleID: refs.roleIDs[1], highSchoolID: ptr(refs.highSchoolA), gradeID: ptr(refs.gradeA1),
		schoolClassID: ptr(refs.classA1), studentNumber: ptr("SCHA-AAAA0001"), pending: true,
	})
	deactivated := mustInsertUser(t, db, userSeed{
		email: "old@example.com", roleID: refs.roleIDs[2], highSchoolID: ptr(refs.highSchoolB),
		deactivated: true,
	})

	got, err := svc.GetUserAttributes(t.Context(), []uint{deactivated, 99999999, student})
	if err != nil {
		t.Fatalf("GetUserAttributes() error = %v, want nil", err)
	}

	want := []UserAttributes{
		{ID: student, Email: "student@example.com", Name: "生徒", NameKana: "セイト", Role: RoleStudent,
			HighSchoolID: ptr(refs.highSchoolA), GradeID: ptr(refs.gradeA1),
			SchoolClassID: ptr(refs.classA1), StudentNumber: ptr("SCHA-AAAA0001")},
		{ID: deactivated, Email: "old@example.com", Role: RoleTeacher,
			HighSchoolID: ptr(refs.highSchoolB), InvitationCompleted: true, Deactivated: true},
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("GetUserAttributes() = %+v, want %+v", got, want)
	}
}

func TestService_GetUserAttributes_Role(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	tests := []struct {
		name     string
		roleName int32
		want     Role
	}{
		{"0は管理者", 0, RoleAdmin},
		{"1は生徒", 1, RoleStudent},
		{"2は教員", 2, RoleTeacher},
		{"3は保護者", 3, RoleGuardian},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			id := mustInsertUser(t, db, userSeed{
				email: tt.name + "@example.com", roleID: refs.roleIDs[tt.roleName]})

			got, err := svc.GetUserAttributes(t.Context(), []uint{id})
			if err != nil || len(got) != 1 || got[0].Role != tt.want {
				t.Errorf("GetUserAttributes() = %+v, %v, want Role %q", got, err, tt.want)
			}
		})
	}
}

func TestService_GetUserAttributes_UnknownRole(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	unknownRole := mustInsert(t, db,
		"INSERT INTO user_roles (name, created_at, updated_at) VALUES (9, NOW(), NOW())")
	id := mustInsertUser(t, db, userSeed{email: "unknown@example.com", roleID: unknownRole})

	_, err := svc.GetUserAttributes(t.Context(), []uint{id})

	var appErr apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode() != http.StatusInternalServerError {
		t.Errorf("GetUserAttributes() error = %v, want 内部エラー（未知の役割）", err)
	}
}
