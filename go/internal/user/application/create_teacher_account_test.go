package application

import (
	"errors"
	"reflect"
	"strings"
	"testing"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

func validTeacherInput(refs testRefs, pending, send bool) CreateTeacherAccountInput {
	return CreateTeacherAccountInput{
		Name: "教員 花子", NameKana: "キョウイン ハナコ", Email: "Hanako@Example.com",
		HighSchoolID: refs.highSchoolA, PendingInvitation: ptr(pending), SendInvitationEmail: ptr(send),
	}
}

func TestService_CreateTeacherAccount_Required(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	tests := []struct {
		name    string
		pending *bool
		send    *bool
		wantErr error
	}{
		{"PendingInvitationがnilはエラー", nil, ptr(true), ErrPendingInvitationRequired},
		{"SendInvitationEmailがnilはエラー", ptr(true), nil, ErrSendInvitationEmailRequired},
		{"両方nilはPendingInvitationのエラー", nil, nil, ErrPendingInvitationRequired},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in := validTeacherInput(refs, true, true)
			in.PendingInvitation, in.SendInvitationEmail = tt.pending, tt.send

			if _, err := svc.CreateTeacherAccount(t.Context(), in); !errors.Is(err, tt.wantErr) {
				t.Errorf("CreateTeacherAccount() error = %v, want %v", err, tt.wantErr)
			}

			if n := countRows(t, db, "SELECT COUNT(*) FROM users"); n != 0 {
				t.Errorf("users = %d件, want 0件", n)
			}
		})
	}
}

func TestService_CreateTeacherAccount_Combinations(t *testing.T) {
	tests := []struct {
		name    string
		pending bool
		send    bool
	}{
		{"教師経路（招待待ち・送信なし）", true, false},
		{"管理者経路（招待待ちなし・送信あり）", false, true},
		{"招待待ち・送信あり", true, true},
		{"招待待ちなし・送信なし", false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, refs := setupTestDB(t)
			svc := newTestService(db, refs).svc

			got, err := svc.CreateTeacherAccount(t.Context(), validTeacherInput(refs, tt.pending, tt.send))
			if err != nil {
				t.Fatalf("CreateTeacherAccount() error = %v, want nil", err)
			}

			row := mustFindCreatedUser(t, db, got.ID)
			if row.PasswordResetRequired != tt.pending || got.InvitationCompleted == tt.pending {
				t.Errorf("招待待ち = %v (InvitationCompleted=%v), want %v",
					row.PasswordResetRequired, got.InvitationCompleted, tt.pending)
			}

			if n := len(invitationJobPayloads(t, db)); (n == 1) != tt.send || n > 1 {
				t.Errorf("jobs = %d件, want 送信依頼 %v", n, tt.send)
			}

			if row.Email != "hanako@example.com" || *row.UserRoleID != refs.roleIDs[2] ||
				row.StudentNumber != nil || row.ActivatedAt != nil || got.Role != RoleTeacher {
				t.Errorf("作成した行 = %+v, want 教員・生徒番号なし・activated_at未設定", row)
			}
		})
	}
}

func TestService_CreateTeacherAccount_Grade(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	withoutGrade, err := svc.CreateTeacherAccount(t.Context(), validTeacherInput(refs, true, false))
	if err != nil || withoutGrade.GradeID != nil {
		t.Fatalf("学年なし = %+v, %v, want GradeID nil・エラーなし（生徒用の学年必須は適用しない）",
			withoutGrade, err)
	}

	in := validTeacherInput(refs, true, false)
	in.Email, in.GradeID = "grade@example.com", ptr(refs.gradeA1)

	withGrade, err := svc.CreateTeacherAccount(t.Context(), in)
	if err != nil || withGrade.GradeID == nil || *withGrade.GradeID != refs.gradeA1 {
		t.Fatalf("学年あり = %+v, %v, want GradeID %d", withGrade, err, refs.gradeA1)
	}

	if row := mustFindCreatedUser(t, db, withGrade.ID); *row.GradeID != refs.gradeA1 {
		t.Errorf("grade_id = %d, want %d", *row.GradeID, refs.gradeA1)
	}
}

func TestService_CreateTeacherAccount_Validation(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc
	mustInsertUser(t, db, userSeed{email: "used@example.com", roleID: refs.roleIDs[2]})

	tests := []struct {
		name   string
		modify func(in *CreateTeacherAccountInput)
		want   []apperror.FieldError
	}{
		{"所属校が未指定", func(in *CreateTeacherAccountInput) { in.HighSchoolID = 0 },
			[]apperror.FieldError{{Field: "high_school_id", Message: "required"}}},
		{"複数項目の不備を1つのエラーで返す", func(in *CreateTeacherAccountInput) {
			in.NameKana, in.Email, in.HighSchoolID = strings.Repeat("ア", 101), "USED@example.com", 0
		}, []apperror.FieldError{{Field: "name_kana", Message: "too_long"},
			{Field: "email", Message: "taken"}, {Field: "high_school_id", Message: "required"}}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in := validTeacherInput(refs, true, true)
			tt.modify(&in)

			_, err := svc.CreateTeacherAccount(t.Context(), in)

			var fe apperror.FieldErrorer
			if !errors.As(err, &fe) || !reflect.DeepEqual(fe.Fields(), tt.want) {
				t.Errorf("CreateTeacherAccount() error = %v, want Validationエラー %v", err, tt.want)
			}
		})
	}
}
