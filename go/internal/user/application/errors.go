package application

import (
	"errors"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

// 呼び出し側の誤用を表すInternalエラー（500）です。errors.Is で判定します。
var (
	ErrLookupEmailRequired = apperror.NewInternal(
		errors.New("user: FindUserByEmail の email が空です"))
	ErrUserIDsRequired = apperror.NewInternal(
		errors.New("user: GetUserAttributes の userIDs が空です"))
	ErrUserIDRequired = apperror.NewInternal(
		errors.New("user: RequestInvitationEmail の userID が0です"))
	ErrSearchConditionRequired = apperror.NewInternal(
		errors.New("user: SearchUsers の絞り込み条件が指定されていません"))
	ErrDeactivatedScopeRequired = apperror.NewInternal(
		errors.New("user: SearchCondition.Deactivated が指定されていません"))
	ErrDeliveryModeRequired = apperror.NewInternal(
		errors.New("user: RequestInvitationEmail の mode が指定されていません"))
	ErrPendingInvitationRequired = apperror.NewInternal(
		errors.New("user: CreateTeacherAccountInput.PendingInvitation が nil です"))
	ErrSendInvitationEmailRequired = apperror.NewInternal(
		errors.New("user: CreateTeacherAccountInput.SendInvitationEmail が nil です"))
)

// FieldError.Field の値です（③「14. Error実装方針」）。
const (
	fieldName         = "name"
	fieldNameKana     = "name_kana"
	fieldEmail        = "email"
	fieldHighSchoolID = "high_school_id"
	fieldGradeID      = "grade_id"
)

// FieldError.Message の識別子です。利用者向けの文言への変換は呼び出し元が行います。
const (
	msgRequired = "required"
	msgInvalid  = "invalid"
	msgTooLong  = "too_long"
	msgTaken    = "taken"
)

// validationErrors は入力の不備を集め、1つの ValidationError にまとめます。
type validationErrors struct {
	fields []apperror.FieldError
}

func (v *validationErrors) add(field, message string) {
	v.fields = append(v.fields, apperror.FieldError{Field: field, Message: message})
}

// err は不備が1件以上あれば ValidationError（422）を、なければ nil を返します。
func (v *validationErrors) err() error {
	if len(v.fields) == 0 {
		return nil
	}

	return apperror.NewValidation(v.fields)
}

// IsEmailAlreadyUsed は err がメールアドレスの使用済み（email の taken）を含むかを返します。
func IsEmailAlreadyUsed(err error) bool {
	var fe apperror.FieldErrorer
	if !errors.As(err, &fe) {
		return false
	}

	for _, f := range fe.Fields() {
		if f.Field == fieldEmail && f.Message == msgTaken {
			return true
		}
	}

	return false
}
