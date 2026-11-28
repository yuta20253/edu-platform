package application

import (
	"errors"
	"fmt"
	"reflect"
	"strings"
	"testing"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

func TestService_CreateAdminAccount(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	got, err := svc.CreateAdminAccount(t.Context(),
		CreateAdminAccountInput{Name: "管理 次郎", Email: " Jiro@Example.com "})
	if err != nil {
		t.Fatalf("CreateAdminAccount() error = %v, want nil", err)
	}

	row := mustFindCreatedUser(t, db, got.ID)
	if row.Email != "jiro@example.com" || *row.Name != "管理 次郎" || *row.UserRoleID != refs.roleIDs[0] ||
		!row.PasswordResetRequired || row.ActivatedAt != nil {
		t.Errorf("作成した行 = %+v, want 管理者・招待待ち", row)
	}

	// 氏名カナ・所属校・学年・クラス・生徒番号は設定しない
	if row.NameKana != nil || row.HighSchoolID != nil || row.GradeID != nil ||
		row.SchoolClassID != nil || row.StudentNumber != nil {
		t.Errorf("作成した行 = %+v, want 氏名カナ・所属校・学年・クラス・生徒番号が未設定", row)
	}

	want := UserAttributes{ID: row.ID, Email: "jiro@example.com", Name: "管理 次郎", Role: RoleAdmin}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("CreateAdminAccount() = %+v, want %+v", got, want)
	}

	payloads := invitationJobPayloads(t, db)
	if len(payloads) != 1 || payloads[0] != fmt.Sprintf(`{"user_id":%d}`, got.ID) {
		t.Errorf("jobs = %v, want 作成したユーザーの招待メール送信依頼1件", payloads)
	}
}

func TestService_CreateAdminAccount_NameFill(t *testing.T) {
	tests := []struct {
		name     string
		in       CreateAdminAccountInput
		wantName string
	}{
		{"氏名が空ならメールの@より前を氏名にする",
			CreateAdminAccountInput{Email: "Admin.Taro@Example.com"}, "Admin.Taro"},
		{"氏名が空白のみでも補う",
			CreateAdminAccountInput{Name: "  ", Email: "hanako@example.com"}, "hanako"},
		{"氏名が指定されていれば補わない",
			CreateAdminAccountInput{Name: "指定", Email: "x@example.com"}, "指定"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, refs := setupTestDB(t)
			svc := newTestService(db, refs).svc

			got, err := svc.CreateAdminAccount(t.Context(), tt.in)
			if err != nil {
				t.Fatalf("CreateAdminAccount() error = %v, want nil", err)
			}

			if row := mustFindCreatedUser(t, db, got.ID); got.Name != tt.wantName ||
				*row.Name != tt.wantName {
				t.Errorf("氏名 = %q (DB %q), want %q", got.Name, *row.Name, tt.wantName)
			}
		})
	}
}

func TestService_CreateAdminAccount_Validation(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc
	mustInsertUser(t, db,
		userSeed{email: "used@example.com", roleID: refs.roleIDs[0], deactivated: true})

	tests := []struct {
		name string
		in   CreateAdminAccountInput
		want []apperror.FieldError
	}{
		{"氏名の100文字超過", CreateAdminAccountInput{Name: strings.Repeat("あ", 101),
			Email: "a@example.com"}, []apperror.FieldError{{Field: "name", Message: "too_long"}}},
		{"補った氏名の100文字超過", CreateAdminAccountInput{
			Email: strings.Repeat("a", 101) + "@example.com"},
			[]apperror.FieldError{{Field: "name", Message: "too_long"}}},
		{"メールが空", CreateAdminAccountInput{Name: "管理者", Email: " "},
			[]apperror.FieldError{{Field: "email", Message: "required"}}},
		{"メールの形式不正", CreateAdminAccountInput{Name: "管理者", Email: "bad"},
			[]apperror.FieldError{{Field: "email", Message: "invalid"}}},
		{"メールの使用済み（論理削除済みを含む）", CreateAdminAccountInput{Email: "Used@example.com"},
			[]apperror.FieldError{{Field: "email", Message: "taken"}}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := svc.CreateAdminAccount(t.Context(), tt.in)

			var fe apperror.FieldErrorer
			if !errors.As(err, &fe) || !reflect.DeepEqual(fe.Fields(), tt.want) {
				t.Errorf("CreateAdminAccount() error = %v, want Validationエラー %v", err, tt.want)
			}

			if n := countRows(t, db, "SELECT COUNT(*) FROM users"); n != 1 {
				t.Errorf("users = %d件, want 1件（作成されない）", n)
			}
		})
	}
}
