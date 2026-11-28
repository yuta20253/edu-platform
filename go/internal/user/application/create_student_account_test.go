package application

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"testing"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
	"github.com/yuta20253/edu-platform/go/internal/shared/transaction/gormtx"
)

// createdUserRow は作成結果の確認に使う users の列です。
type createdUserRow struct {
	ID                    uint
	Email                 string
	Name                  *string
	NameKana              *string
	UserRoleID            *uint
	HighSchoolID          *uint
	GradeID               *uint
	SchoolClassID         *uint
	StudentNumber         *string
	EncryptedPassword     string
	JTI                   string
	PasswordResetRequired bool
	ActivatedAt           *string
	AddressID             *uint
	DeletedAt             *string
}

func mustFindCreatedUser(t *testing.T, db *gorm.DB, id uint) createdUserRow {
	t.Helper()

	var rows []createdUserRow
	if err := db.Raw("SELECT id, email, name, name_kana, user_role_id, high_school_id, grade_id, "+
		"school_class_id, student_number, encrypted_password, jti, password_reset_required, "+
		"CAST(activated_at AS CHAR) AS activated_at, address_id, "+
		"CAST(deleted_at AS CHAR) AS deleted_at FROM users WHERE id = ?", id).
		Scan(&rows).Error; err != nil || len(rows) != 1 {
		t.Fatalf("ユーザー(id=%d)の取得に失敗しました: %v", id, err)
	}

	return rows[0]
}

func countRows(t *testing.T, db *gorm.DB, query string, args ...any) int64 {
	t.Helper()

	var n int64
	if err := db.Raw(query, args...).Scan(&n).Error; err != nil {
		t.Fatalf("件数の取得に失敗しました(%s): %v", query, err)
	}

	return n
}

func invitationJobPayloads(t *testing.T, db *gorm.DB) []string {
	t.Helper()

	var payloads []string
	if err := db.Raw("SELECT payload FROM jobs WHERE type = ? ORDER BY id",
		"user_invitation_email").Scan(&payloads).Error; err != nil {
		t.Fatalf("jobsの取得に失敗しました: %v", err)
	}

	return payloads
}

var (
	uuidPattern = regexp.MustCompile(
		`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	bcrypt12      = regexp.MustCompile(`^\$2a\$12\$`)
	studentNumber = regexp.MustCompile(`^SCHA-[A-Z0-9]{8}$`)
)

func validStudentInput(refs testRefs) CreateStudentAccountInput {
	return CreateStudentAccountInput{
		Name: "生徒 太郎", NameKana: "セイト タロウ", Email: "  Taro@Example.com ",
		HighSchoolID: refs.highSchoolA, GradeID: refs.gradeA1, SchoolClassID: ptr(refs.classA1),
	}
}

func assertStudentRow(t *testing.T, got createdUserRow, refs testRefs) {
	t.Helper()

	if got.Email != "taro@example.com" || *got.Name != "生徒 太郎" || *got.NameKana != "セイト タロウ" ||
		*got.UserRoleID != refs.roleIDs[1] || *got.HighSchoolID != refs.highSchoolA ||
		*got.GradeID != refs.gradeA1 || *got.SchoolClassID != refs.classA1 {
		t.Errorf("作成した行 = %+v, want 入力の値（メールは正規化後）", got)
	}

	if !got.PasswordResetRequired || got.ActivatedAt != nil || got.AddressID != nil ||
		got.DeletedAt != nil {
		t.Errorf("状態 = {PasswordResetRequired:%v ActivatedAt:%v AddressID:%v DeletedAt:%v}, "+
			"want 招待待ち・activated_at等は未設定", got.PasswordResetRequired, got.ActivatedAt,
			got.AddressID, got.DeletedAt)
	}

	if got.StudentNumber == nil || !studentNumber.MatchString(*got.StudentNumber) ||
		!bcrypt12.MatchString(got.EncryptedPassword) || !uuidPattern.MatchString(got.JTI) {
		t.Errorf("{StudentNumber:%v EncryptedPassword:%q JTI:%q}, want 生徒番号・bcrypt・UUID v4",
			got.StudentNumber, got.EncryptedPassword, got.JTI)
	}
}

func TestService_CreateStudentAccount(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	got, err := svc.CreateStudentAccount(t.Context(), validStudentInput(refs))
	if err != nil {
		t.Fatalf("CreateStudentAccount() error = %v, want nil", err)
	}

	row := mustFindCreatedUser(t, db, got.ID)
	assertStudentRow(t, row, refs)

	want := UserAttributes{ID: row.ID, Email: "taro@example.com", Name: "生徒 太郎",
		NameKana: "セイト タロウ", Role: RoleStudent, HighSchoolID: ptr(refs.highSchoolA),
		GradeID: ptr(refs.gradeA1), SchoolClassID: ptr(refs.classA1), StudentNumber: row.StudentNumber}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("CreateStudentAccount() = %+v, want %+v", got, want)
	}

	payloads := invitationJobPayloads(t, db)
	if len(payloads) != 1 || payloads[0] != fmt.Sprintf(`{"user_id":%d}`, got.ID) {
		t.Errorf("jobs = %v, want 作成したユーザーの招待メール送信依頼1件", payloads)
	}
}

type studentValidationCase struct {
	name   string
	modify func(in *CreateStudentAccountInput)
	want   []apperror.FieldError
}

func studentValidationCases() []studentValidationCase {
	return []studentValidationCase{
		{"氏名と氏名カナの100文字超過", func(in *CreateStudentAccountInput) {
			in.Name, in.NameKana = strings.Repeat("あ", 101), strings.Repeat("ア", 101)
		}, []apperror.FieldError{{Field: "name", Message: "too_long"},
			{Field: "name_kana", Message: "too_long"}}},
		{"メール・所属校・学年の未指定をまとめて返す", func(in *CreateStudentAccountInput) {
			in.Email, in.HighSchoolID, in.GradeID = " ", 0, 0
		}, []apperror.FieldError{{Field: "email", Message: "required"},
			{Field: "high_school_id", Message: "required"}, {Field: "grade_id", Message: "required"}}},
		{"メールの形式不正", func(in *CreateStudentAccountInput) { in.Email = "taro.example.com" },
			[]apperror.FieldError{{Field: "email", Message: "invalid"}}},
		{"メールの255文字超過", func(in *CreateStudentAccountInput) {
			in.Email = strings.Repeat("a", 244) + "@example.com"
		}, []apperror.FieldError{{Field: "email", Message: "too_long"}}},
		{"メールの使用済み（論理削除済みを含む）", func(in *CreateStudentAccountInput) {
			in.Email = "OLD@example.com"
		}, []apperror.FieldError{{Field: "email", Message: "taken"}}},
		{"複数項目の不備を1つのエラーで返す", func(in *CreateStudentAccountInput) {
			in.Name, in.Email, in.GradeID = strings.Repeat("あ", 101), "bad", 0
		}, []apperror.FieldError{{Field: "name", Message: "too_long"},
			{Field: "email", Message: "invalid"}, {Field: "grade_id", Message: "required"}}},
	}
}

func TestService_CreateStudentAccount_Validation(t *testing.T) {
	for _, tt := range studentValidationCases() {
		t.Run(tt.name, func(t *testing.T) {
			db, refs := setupTestDB(t)
			svc := newTestService(db, refs).svc
			mustInsertUser(t, db, userSeed{email: "old@example.com", roleID: refs.roleIDs[1],
				deactivated: true})

			in := validStudentInput(refs)
			tt.modify(&in)

			_, err := svc.CreateStudentAccount(t.Context(), in)

			var fe apperror.FieldErrorer
			if !errors.As(err, &fe) || !reflect.DeepEqual(fe.Fields(), tt.want) {
				t.Fatalf("CreateStudentAccount() error = %v, want Validationエラー %v", err, tt.want)
			}

			if n := countRows(t, db, "SELECT COUNT(*) FROM users"); n != 1 {
				t.Errorf("users = %d件, want 1件（作成されない）", n)
			}

			if p := invitationJobPayloads(t, db); len(p) != 0 {
				t.Errorf("jobs = %v, want なし", p)
			}
		})
	}
}

func TestService_CreateStudentAccount_NameBoundary(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	in := validStudentInput(refs)
	in.Name, in.NameKana = strings.Repeat("あ", 100), strings.Repeat("ア", 100)
	in.Email = strings.Repeat("a", 243) + "@example.com" // 255文字

	if _, err := svc.CreateStudentAccount(t.Context(), in); err != nil {
		t.Errorf("CreateStudentAccount() error = %v, want nil（100文字・255文字は許容）", err)
	}
}

// insertConcurrently は、呼び出し側のトランザクションが読み取りの時点を確定させた後に、
// 別の接続でユーザーを作成してコミットします（同時に作成された状況を再現する）。
func insertConcurrently(ctx context.Context, t *testing.T, db *gorm.DB, tx *gorm.DB, s userSeed) {
	t.Helper()

	var n int64
	if err := tx.WithContext(ctx).Raw("SELECT COUNT(*) FROM users").Scan(&n).Error; err != nil {
		t.Fatalf("読み取りに失敗しました: %v", err)
	}

	mustInsertUser(t, db, s)

	var after int64
	if err := tx.WithContext(ctx).Raw("SELECT COUNT(*) FROM users").Scan(&after).Error; err != nil ||
		after != n {
		t.Fatalf("呼び出し側のトランザクションから別接続の作成が見えています(%d→%d): %v", n, after, err)
	}
}

func TestService_CreateStudentAccount_EmailUniqueViolation(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	err := gormtx.RunInTx(t.Context(), db, func(ctx context.Context, tx *gorm.DB) error {
		insertConcurrently(ctx, t, db, tx, userSeed{email: "taro@example.com", roleID: refs.roleIDs[1]})

		_, err := svc.CreateStudentAccount(ctx, validStudentInput(refs))

		return err
	})

	if !IsEmailAlreadyUsed(err) {
		t.Errorf("CreateStudentAccount() error = %v, want email の taken", err)
	}

	if n := countRows(t, db, "SELECT COUNT(*) FROM users"); n != 1 {
		t.Errorf("users = %d件, want 1件（先に作成された分のみ）", n)
	}
}

func TestService_CreateStudentAccount_StudentNumberUniqueViolation(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	var calls int
	svc.studentNumberCode = sequenceCodes(&calls, "AAAAAAAA", "BBBBBBBB")

	var got UserAttributes

	err := gormtx.RunInTx(t.Context(), db, func(ctx context.Context, tx *gorm.DB) error {
		insertConcurrently(ctx, t, db, tx, userSeed{email: "other@example.com",
			roleID: refs.roleIDs[1], studentNumber: ptr("SCHA-AAAAAAAA")})

		var err error
		got, err = svc.CreateStudentAccount(ctx, validStudentInput(refs))

		return err
	})
	if err != nil {
		t.Fatalf("CreateStudentAccount() error = %v, want nil（生徒番号を再発行して作成する）", err)
	}

	if got.StudentNumber == nil || *got.StudentNumber != "SCHA-BBBBBBBB" {
		t.Errorf("StudentNumber = %v, want SCHA-BBBBBBBB", got.StudentNumber)
	}
}

func TestService_CreateStudentAccount_CallerRollback(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc
	errBoom := errors.New("boom")

	err := gormtx.RunInTx(t.Context(), db, func(ctx context.Context, _ *gorm.DB) error {
		if _, err := svc.CreateStudentAccount(ctx, validStudentInput(refs)); err != nil {
			return err
		}

		return errBoom
	})
	if !errors.Is(err, errBoom) {
		t.Fatalf("RunInTx() error = %v, want %v", err, errBoom)
	}

	if n := countRows(t, db, "SELECT COUNT(*) FROM users"); n != 0 {
		t.Errorf("users = %d件, want 0件", n)
	}

	if p := invitationJobPayloads(t, db); len(p) != 0 {
		t.Errorf("jobs = %v, want なし（依頼も取り消される）", p)
	}
}

func TestService_CreateStudentAccount_SchoolCodeError(t *testing.T) {
	db, refs := setupTestDB(t)
	d := newTestService(db, refs)
	d.schoolCodes.codes = map[uint]string{}

	_, err := d.svc.CreateStudentAccount(t.Context(), validStudentInput(refs))
	assertInternalError(t, err)

	if n := countRows(t, db, "SELECT COUNT(*) FROM users"); n != 0 {
		t.Errorf("users = %d件, want 0件", n)
	}
}
