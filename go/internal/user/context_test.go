package user

import (
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"testing"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
	"github.com/yuta20253/edu-platform/go/internal/user/application"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure/mail"
)

func TestReexportedConstants(t *testing.T) {
	tests := []struct {
		name      string
		got, want any
	}{
		{"RoleAdmin", RoleAdmin, application.RoleAdmin},
		{"RoleStudent", RoleStudent, application.RoleStudent},
		{"RoleTeacher", RoleTeacher, application.RoleTeacher},
		{"RoleGuardian", RoleGuardian, application.RoleGuardian},
		{"ActiveOnly", ActiveOnly, application.ActiveOnly},
		{"IncludeDeactivated", IncludeDeactivated, application.IncludeDeactivated},
		{"AggregateNone", AggregateNone, application.AggregateNone},
		{"AggregateByRole", AggregateByRole, application.AggregateByRole},
		{"AggregateByHighSchool", AggregateByHighSchool, application.AggregateByHighSchool},
		{"AggregateByGrade", AggregateByGrade, application.AggregateByGrade},
		{"DeliveryEnqueue", DeliveryEnqueue, application.DeliveryEnqueue},
		{"DeliveryImmediate", DeliveryImmediate, application.DeliveryImmediate},
		{"InvitationSent", InvitationSent, application.InvitationSent},
		{"InvitationFailed", InvitationFailed, application.InvitationFailed},
		{"InvitationSkipped", InvitationSkipped, application.InvitationSkipped},
		{"InvitationEmailJobType", InvitationEmailJobType, "user_invitation_email"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.got != tt.want {
				t.Errorf("%s = %v, want %v", tt.name, tt.got, tt.want)
			}
		})
	}
}

func TestReexportedTypes(t *testing.T) {
	tests := []struct {
		name      string
		got, want reflect.Type
	}{
		{"UserAttributes", reflect.TypeFor[UserAttributes](),
			reflect.TypeFor[application.UserAttributes]()},
		{"Role", reflect.TypeFor[Role](), reflect.TypeFor[application.Role]()},
		{"SearchCondition", reflect.TypeFor[SearchCondition](),
			reflect.TypeFor[application.SearchCondition]()},
		{"DeactivatedScope", reflect.TypeFor[DeactivatedScope](),
			reflect.TypeFor[application.DeactivatedScope]()},
		{"AggregateUnit", reflect.TypeFor[AggregateUnit](), reflect.TypeFor[application.AggregateUnit]()},
		{"CountResult", reflect.TypeFor[CountResult](), reflect.TypeFor[application.CountResult]()},
		{"CreateStudentAccountInput", reflect.TypeFor[CreateStudentAccountInput](),
			reflect.TypeFor[application.CreateStudentAccountInput]()},
		{"CreateTeacherAccountInput", reflect.TypeFor[CreateTeacherAccountInput](),
			reflect.TypeFor[application.CreateTeacherAccountInput]()},
		{"CreateAdminAccountInput", reflect.TypeFor[CreateAdminAccountInput](),
			reflect.TypeFor[application.CreateAdminAccountInput]()},
		{"TokenIssuer", reflect.TypeFor[TokenIssuer](), reflect.TypeFor[application.TokenIssuer]()},
		{"SchoolCodeReader", reflect.TypeFor[SchoolCodeReader](),
			reflect.TypeFor[application.SchoolCodeReader]()},
		{"DeliveryMode", reflect.TypeFor[DeliveryMode](), reflect.TypeFor[application.DeliveryMode]()},
		{"InvitationResult", reflect.TypeFor[InvitationResult](),
			reflect.TypeFor[application.InvitationResult]()},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.got != tt.want {
				t.Errorf("user.%s = %v, want application.%s と同じ型（型エイリアス）", tt.name, tt.got, tt.name)
			}
		})
	}
}

func TestReexportedErrors(t *testing.T) {
	tests := []struct {
		name      string
		got, want error
	}{
		{"ErrLookupEmailRequired", ErrLookupEmailRequired, application.ErrLookupEmailRequired},
		{"ErrUserIDsRequired", ErrUserIDsRequired, application.ErrUserIDsRequired},
		{"ErrUserIDRequired", ErrUserIDRequired, application.ErrUserIDRequired},
		{"ErrSearchConditionRequired", ErrSearchConditionRequired,
			application.ErrSearchConditionRequired},
		{"ErrDeactivatedScopeRequired", ErrDeactivatedScopeRequired,
			application.ErrDeactivatedScopeRequired},
		{"ErrDeliveryModeRequired", ErrDeliveryModeRequired, application.ErrDeliveryModeRequired},
		{"ErrPendingInvitationRequired", ErrPendingInvitationRequired,
			application.ErrPendingInvitationRequired},
		{"ErrSendInvitationEmailRequired", ErrSendInvitationEmailRequired,
			application.ErrSendInvitationEmailRequired},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if !errors.Is(fmt.Errorf("x: %w", tt.want), tt.got) {
				t.Errorf("errors.Is(application.%s, user.%s) = false, want true", tt.name, tt.name)
			}
		})
	}

	taken := apperror.NewValidation([]apperror.FieldError{{Field: "email", Message: "taken"}})
	if !IsEmailAlreadyUsed(taken) || IsEmailAlreadyUsed(ErrUserIDsRequired) {
		t.Errorf("IsEmailAlreadyUsed が application.IsEmailAlreadyUsed と同じ判定になりません")
	}
}

func TestNewMailer(t *testing.T) {
	got := newMailer("https://front.example.com")
	want := mail.NewInvitationMailer("https://front.example.com", mail.NopSender{})

	if !reflect.DeepEqual(got, want) {
		t.Errorf("newMailer() = %#v, want %#v", got, want)
	}
}

func TestContext_InvitationEmailHandler(t *testing.T) {
	db, refs := setupTestDB(t)
	tokens, codes := newStubs(refs)
	c := NewContext(db, discardLogger(), tokens, codes, "https://front.example.com")
	id := mustInsertUser(t, db, userSeed{email: "t@example.com", roleID: refs.roleIDs[2]})

	handler := c.InvitationEmailHandler()

	if err := handler(t.Context(), fmt.Appendf(nil, `{"user_id":%d}`, id)); err != nil {
		t.Errorf("handler() error = %v, want nil（NopSender で送信成功）", err)
	}

	tokens.err = errors.New("failed")
	if err := handler(t.Context(), fmt.Appendf(nil, `{"user_id":%d}`, id)); err == nil {
		t.Errorf("handler() error = nil, want error（送信失敗は再試行）")
	}

	if tokens.issuedCount() != 2 {
		t.Errorf("トークンの発行回数 = %d, want 2（Service.HandleInvitationEmailJob が実行される）",
			tokens.issuedCount())
	}
}

// TestContext_Delegation は Context の公開操作が Service の同名のメソッドへ委譲されることを確認します。
// 業務ルールの網羅は application のテストで行い、ここでは結線のみを確認します。
func TestContext_Delegation(t *testing.T) {
	db, refs := setupTestDB(t)
	tokens, codes := newStubs(refs)
	c := NewContext(db, discardLogger(), tokens, codes, "https://front.example.com")
	ctx := t.Context()

	student, err := c.CreateStudentAccount(ctx, CreateStudentAccountInput{Name: "生徒", NameKana: "セイト",
		Email: "s@example.com", HighSchoolID: refs.highSchoolA, GradeID: refs.gradeA1})
	if err != nil || student.Role != RoleStudent {
		t.Fatalf("CreateStudentAccount() = %+v, %v", student, err)
	}

	teacher, err := c.CreateTeacherAccount(ctx, CreateTeacherAccountInput{
		Name: "教員", NameKana: "キョウイン", Email: "t@example.com", HighSchoolID: refs.highSchoolA,
		PendingInvitation: ptr(false), SendInvitationEmail: ptr(false)})
	if err != nil || teacher.Role != RoleTeacher || !teacher.InvitationCompleted {
		t.Fatalf("CreateTeacherAccount() = %+v, %v", teacher, err)
	}

	admin, err := c.CreateAdminAccount(ctx, CreateAdminAccountInput{Email: "boss@example.com"})
	if err != nil || admin.Role != RoleAdmin || admin.Name != "boss" {
		t.Fatalf("CreateAdminAccount() = %+v, %v", admin, err)
	}

	_, err = c.CreateAdminAccount(ctx, CreateAdminAccountInput{Email: "boss@example.com"})
	if !IsEmailAlreadyUsed(err) {
		t.Errorf("CreateAdminAccount(重複) error = %v, want email の taken", err)
	}

	assertReads(t, c, refs, student.ID, teacher.ID, admin.ID)

	number, err := c.IssueStudentNumber(ctx, refs.highSchoolA)
	if err != nil || !regexp.MustCompile(`^SCHA-[A-Z0-9]{8}$`).MatchString(number) {
		t.Errorf("IssueStudentNumber() = %q, %v", number, err)
	}

	result, err := c.RequestInvitationEmail(ctx, teacher.ID, DeliveryImmediate)
	if err != nil || result != InvitationSent {
		t.Errorf("RequestInvitationEmail() = %v, %v, want InvitationSent", result, err)
	}

	_, err = c.RequestInvitationEmail(ctx, 0, DeliveryEnqueue)
	if !errors.Is(err, ErrUserIDRequired) {
		t.Errorf("RequestInvitationEmail(0) error = %v, want %v", err, ErrUserIDRequired)
	}
}

func assertReads(t *testing.T, c *Context, refs testRefs, studentID, teacherID, adminID uint) {
	t.Helper()

	ctx := t.Context()

	attrs, err := c.GetUserAttributes(ctx, []uint{adminID, studentID})
	if err != nil || len(attrs) != 2 || attrs[0].ID != studentID {
		t.Errorf("GetUserAttributes() = %+v, %v", attrs, err)
	}

	found, ok, err := c.FindUserByEmail(ctx, " T@Example.com ")
	if err != nil || !ok || found.ID != teacherID {
		t.Errorf("FindUserByEmail() = %+v, %v, %v", found, ok, err)
	}

	list, err := c.SearchUsers(ctx, SearchCondition{HighSchoolIDs: []uint{refs.highSchoolA},
		Deactivated: ActiveOnly})
	if err != nil || len(list) != 2 {
		t.Errorf("SearchUsers() = %+v, %v, want 2件", list, err)
	}

	counts, err := c.CountUsers(ctx, SearchCondition{HighSchoolIDs: []uint{refs.highSchoolA},
		Deactivated: ActiveOnly}, AggregateByRole)
	if err != nil || len(counts) != 2 {
		t.Errorf("CountUsers() = %+v, %v, want 2グループ", counts, err)
	}
}
