package application

import (
	"errors"
	"net/http"
	"regexp"
	"testing"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

// sequenceCodes は codes を順に返し、使い切った後は最後の値を返し続ける生成関数です。
func sequenceCodes(calls *int, codes ...string) func() (string, error) {
	return func() (string, error) {
		i := min(*calls, len(codes)-1)
		*calls++

		return codes[i], nil
	}
}

func assertInternalError(t *testing.T, err error) {
	t.Helper()

	var appErr apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode() != http.StatusInternalServerError {
		t.Errorf("error = %v, want 内部エラー", err)
	}
}

func TestService_IssueStudentNumber_Format(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	got, err := svc.IssueStudentNumber(t.Context(), refs.highSchoolA)
	if err != nil {
		t.Fatalf("IssueStudentNumber() error = %v, want nil", err)
	}

	if !regexp.MustCompile(`^SCHA-[A-Z0-9]{8}$`).MatchString(got) {
		t.Errorf("IssueStudentNumber() = %q, want 学校コード-8桁の英数字大文字", got)
	}
}

func TestRandomStudentNumberCode(t *testing.T) {
	pattern := regexp.MustCompile(`^[A-Z0-9]{8}$`)
	seen := map[string]bool{}

	for range 200 {
		code, err := randomStudentNumberCode()
		if err != nil || !pattern.MatchString(code) {
			t.Fatalf("randomStudentNumberCode() = %q, %v, want 8桁の英数字大文字", code, err)
		}

		seen[code] = true
	}

	if len(seen) < 190 {
		t.Errorf("200回の生成で異なる値が %d 件, want ほぼすべて異なる", len(seen))
	}
}

func TestService_IssueStudentNumber_Reissue(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	// 論理削除済みのユーザーが使用中の番号とも重複させない
	mustInsertUser(t, db, userSeed{email: "old@example.com", roleID: refs.roleIDs[1],
		studentNumber: ptr("SCHA-AAAAAAAA"), deactivated: true})

	var calls int
	svc.studentNumberCode = sequenceCodes(&calls, "AAAAAAAA", "BBBBBBBB")

	got, err := svc.IssueStudentNumber(t.Context(), refs.highSchoolA)
	if err != nil || got != "SCHA-BBBBBBBB" || calls != 2 {
		t.Errorf("IssueStudentNumber() = %q, %v (calls=%d), want SCHA-BBBBBBBB, nil (calls=2)",
			got, err, calls)
	}
}

func TestService_IssueStudentNumber_Exhausted(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	mustInsertUser(t, db, userSeed{email: "s@example.com", roleID: refs.roleIDs[1],
		studentNumber: ptr("SCHA-AAAAAAAA")})

	var calls int
	svc.studentNumberCode = sequenceCodes(&calls, "AAAAAAAA")

	_, err := svc.IssueStudentNumber(t.Context(), refs.highSchoolA)
	assertInternalError(t, err)

	if calls != maxStudentNumberAttempts {
		t.Errorf("発行の試行回数 = %d, want %d", calls, maxStudentNumberAttempts)
	}
}

func TestService_IssueStudentNumber_SchoolCode(t *testing.T) {
	tests := []struct {
		name  string
		codes map[uint]string
	}{
		{name: "学校コードを取得できない（高校が無い）と内部エラー", codes: map[uint]string{}},
		{name: "学校コードが空だと内部エラー", codes: nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, refs := setupTestDB(t)
			d := newTestService(db, refs)

			d.schoolCodes.codes = tt.codes
			if tt.codes == nil {
				d.schoolCodes.codes = map[uint]string{refs.highSchoolA: ""}
			}

			_, err := d.svc.IssueStudentNumber(t.Context(), refs.highSchoolA)
			assertInternalError(t, err)
		})
	}
}
