package infrastructure

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue/worker"
	"github.com/yuta20253/edu-platform/go/internal/shared/transaction/gormtx"
)

func studentParams(refs testRefs, email, number string) CreateUserParams {
	return CreateUserParams{
		Email:                  email,
		Name:                   ptr("生徒"),
		NameKana:               ptr("セイト"),
		RoleName:               1,
		HighSchoolID:           ptr(refs.highSchoolA),
		GradeID:                ptr(refs.gradeA1),
		SchoolClassID:          ptr(refs.classA1),
		StudentNumber:          ptr(number),
		EncryptedPassword:      "hashed-password",
		JTI:                    "jti-" + email,
		PasswordResetRequired:  true,
		EnqueueInvitationEmail: true,
	}
}

func mustFindUserModel(t *testing.T, db *gorm.DB, id uint) userModel {
	t.Helper()

	var m userModel
	if err := db.First(&m, id).Error; err != nil {
		t.Fatalf("ユーザー(id=%d)の取得に失敗しました: %v", id, err)
	}

	return m
}

func countUsers(t *testing.T, db *gorm.DB) int64 {
	t.Helper()

	var n int64
	if err := db.Model(&userModel{}).Count(&n).Error; err != nil {
		t.Fatalf("Countに失敗しました: %v", err)
	}

	return n
}

func assertCreatedColumns(t *testing.T, got userModel, refs testRefs) {
	t.Helper()

	if got.Email != "new@example.com" || *got.Name != "生徒" || *got.NameKana != "セイト" ||
		*got.UserRoleID != refs.roleIDs[1] || *got.HighSchoolID != refs.highSchoolA ||
		*got.GradeID != refs.gradeA1 || *got.SchoolClassID != refs.classA1 ||
		*got.StudentNumber != "A-NEW00001" || got.EncryptedPassword != "hashed-password" ||
		got.JTI != "jti-new@example.com" || !got.PasswordResetRequired {
		t.Errorf("作成した行 = %+v, want 指定した列の値", got)
	}

	// 他Contextが所有する列は設定しない
	if got.AddressID != nil || got.ActivatedAt != nil || got.DeletedAt != nil ||
		got.ResetPasswordToken != nil || got.ResetPasswordSentAt != nil ||
		got.RememberCreatedAt != nil {
		t.Errorf("他Contextの列 = {AddressID:%v ActivatedAt:%v DeletedAt:%v ResetPasswordToken:%v}, "+
			"want すべてNULL", got.AddressID, got.ActivatedAt, got.DeletedAt, got.ResetPasswordToken)
	}
}

func TestCreateUser(t *testing.T) {
	db, refs := setupTestDB(t)

	id, err := CreateUser(t.Context(), db, worker.NewPublisher(db),
		studentParams(refs, "new@example.com", "A-NEW00001"))
	if err != nil {
		t.Fatalf("CreateUser() error = %v, want nil", err)
	}

	assertCreatedColumns(t, mustFindUserModel(t, db, id), refs)

	jobs := mustListInvitationJobs(t, db)
	if len(jobs) != 1 || jobs[0].Payload != fmt.Sprintf(`{"user_id":%d}`, id) {
		t.Errorf("jobs = %+v, want 作成したユーザーの招待メール送信依頼1件", jobs)
	}
}

func TestCreateUser_WithoutInvitation(t *testing.T) {
	db, refs := setupTestDB(t)

	p := studentParams(refs, "new@example.com", "A-NEW00001")
	p.EnqueueInvitationEmail = false

	if _, err := CreateUser(t.Context(), db, worker.NewPublisher(db), p); err != nil {
		t.Fatalf("CreateUser() error = %v, want nil", err)
	}

	if got := len(mustListInvitationJobs(t, db)); got != 0 {
		t.Errorf("len(jobs) = %d, want 0（送信依頼を登録しない）", got)
	}
}

type duplicateCase struct {
	name           string
	translateError bool
	email          string
	number         string
	wantErr        error
}

func duplicateCases() []duplicateCase {
	return []duplicateCase{
		{"メールアドレスの一意制約違反を検出する", false, "dup@example.com", "A-OTHER001", ErrEmailTaken},
		{"生徒番号の一意制約違反を検出する", false, "other@example.com", "A-DUP00001", ErrStudentNumberTaken},
		{"TranslateError有効でもメールアドレスの違反を検出する", true,
			"dup@example.com", "A-OTHER001", ErrEmailTaken},
		{"TranslateError有効でも生徒番号の違反を検出する", true,
			"other@example.com", "A-DUP00001", ErrStudentNumberTaken},
	}
}

func TestCreateUser_Duplicate(t *testing.T) {
	for _, tt := range duplicateCases() {
		t.Run(tt.name, func(t *testing.T) {
			db, refs := setupTestDB(t)
			mustCreateUser(t, db, userModel{Email: "dup@example.com",
				UserRoleID: ptr(refs.roleIDs[1]), StudentNumber: ptr("A-DUP00001")})

			target := openTestDB(t, tt.translateError)

			_, err := CreateUser(t.Context(), target, worker.NewPublisher(target),
				studentParams(refs, tt.email, tt.number))
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("CreateUser() error = %v, want %v", err, tt.wantErr)
			}

			if n := countUsers(t, db); n != 1 {
				t.Errorf("users = %d件, want 1件（作成されない）", n)
			}

			if got := len(mustListInvitationJobs(t, db)); got != 0 {
				t.Errorf("len(jobs) = %d, want 0", got)
			}
		})
	}
}

func TestCreateUser_CallerTransaction(t *testing.T) {
	errBoom := errors.New("boom")

	tests := []struct {
		name      string
		fnErr     error
		wantCount int64
	}{
		{name: "呼び出し側がコミットするとアカウントと依頼が残る", wantCount: 1},
		{name: "呼び出し側がロールバックするとアカウントも依頼も残らない", fnErr: errBoom, wantCount: 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, refs := setupTestDB(t)
			pub := worker.NewPublisher(db)

			err := gormtx.RunInTx(t.Context(), db, func(ctx context.Context, _ *gorm.DB) error {
				if _, err := CreateUser(ctx, db, pub,
					studentParams(refs, "new@example.com", "A-NEW00001")); err != nil {
					return err
				}

				return tt.fnErr
			})
			if !errors.Is(err, tt.fnErr) {
				t.Fatalf("RunInTx() error = %v, want %v", err, tt.fnErr)
			}

			if n := countUsers(t, db); n != tt.wantCount {
				t.Errorf("users = %d件, want %d件", n, tt.wantCount)
			}

			if got := int64(len(mustListInvitationJobs(t, db))); got != tt.wantCount {
				t.Errorf("jobs = %d件, want %d件", got, tt.wantCount)
			}
		})
	}
}

func TestCreateUser_PublishError(t *testing.T) {
	db, refs := setupTestDB(t)
	errPublish := errors.New("publish failed")

	_, err := CreateUser(t.Context(), db, failingPublisher{err: errPublish},
		studentParams(refs, "new@example.com", "A-NEW00001"))
	if !errors.Is(err, errPublish) {
		t.Fatalf("CreateUser() error = %v, want %v", err, errPublish)
	}

	if n := countUsers(t, db); n != 0 {
		t.Errorf("users = %d件, want 0件（依頼の登録に失敗するとアカウントも残らない）", n)
	}
}

func TestCreateUser_RoleNotFound(t *testing.T) {
	db, refs := setupTestDB(t)
	mustExec(t, db, "DELETE FROM user_roles WHERE name = ?", 1)

	_, err := CreateUser(t.Context(), db, worker.NewPublisher(db),
		studentParams(refs, "new@example.com", "A-NEW00001"))
	if !errors.Is(err, ErrRoleNotFound) {
		t.Fatalf("CreateUser() error = %v, want %v", err, ErrRoleNotFound)
	}

	if n := countUsers(t, db); n != 0 {
		t.Errorf("users = %d件, want 0件", n)
	}
}
