package application

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"testing"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

func TestValidationErrors(t *testing.T) {
	var v validationErrors

	v.add(fieldName, msgTooLong)
	v.add(fieldEmail, msgInvalid)
	v.add(fieldEmail, msgTaken)

	err := v.err()

	var appErr apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode() != http.StatusUnprocessableEntity {
		t.Fatalf("err = %v, want 422のAppError", err)
	}

	var fe apperror.FieldErrorer
	if !errors.As(err, &fe) {
		t.Fatalf("err = %v, want FieldErrorer", err)
	}

	want := []apperror.FieldError{
		{Field: "name", Message: "too_long"},
		{Field: "email", Message: "invalid"},
		{Field: "email", Message: "taken"},
	}
	if !reflect.DeepEqual(fe.Fields(), want) {
		t.Errorf("Fields() = %v, want %v", fe.Fields(), want)
	}
}

func TestValidationErrors_Empty(t *testing.T) {
	var v validationErrors

	if err := v.err(); err != nil {
		t.Errorf("err() = %v, want nil", err)
	}
}

func TestSentinelErrors(t *testing.T) {
	sentinels := []struct {
		name string
		err  error
	}{
		{"ErrLookupEmailRequired", ErrLookupEmailRequired},
		{"ErrUserIDsRequired", ErrUserIDsRequired},
		{"ErrUserIDRequired", ErrUserIDRequired},
		{"ErrSearchConditionRequired", ErrSearchConditionRequired},
		{"ErrDeactivatedScopeRequired", ErrDeactivatedScopeRequired},
		{"ErrDeliveryModeRequired", ErrDeliveryModeRequired},
		{"ErrPendingInvitationRequired", ErrPendingInvitationRequired},
		{"ErrSendInvitationEmailRequired", ErrSendInvitationEmailRequired},
	}

	for _, tt := range sentinels {
		t.Run(tt.name, func(t *testing.T) {
			var appErr apperror.AppError
			if !errors.As(tt.err, &appErr) ||
				appErr.StatusCode() != http.StatusInternalServerError {
				t.Fatalf("%s = %v, want 500のAppError", tt.name, tt.err)
			}

			wrapped := fmt.Errorf("呼び出し元: %w", tt.err)
			if !errors.Is(wrapped, tt.err) {
				t.Errorf("errors.Is(wrapped, %s) = false, want true", tt.name)
			}

			for _, other := range sentinels {
				if other.name != tt.name && errors.Is(tt.err, other.err) {
					t.Errorf("errors.Is(%s, %s) = true, want false", tt.name, other.name)
				}
			}
		})
	}
}

func isEmailAlreadyUsedCases() []struct {
	name string
	err  error
	want bool
} {
	return []struct {
		name string
		err  error
		want bool
	}{
		{"emailのtakenを含むと真", apperror.NewValidation([]apperror.FieldError{
			{Field: "name", Message: "too_long"}, {Field: "email", Message: "taken"},
		}), true},
		{"ラップされていても真", fmt.Errorf("x: %w", apperror.NewValidation(
			[]apperror.FieldError{{Field: "email", Message: "taken"}})), true},
		{"emailのtaken以外のみなら偽", apperror.NewValidation([]apperror.FieldError{
			{Field: "email", Message: "invalid"},
		}), false},
		{"他の項目のtakenのみなら偽", apperror.NewValidation([]apperror.FieldError{
			{Field: "name", Message: "taken"},
		}), false},
		{"Internalエラーは偽", ErrUserIDsRequired, false},
		{"nilは偽", nil, false},
	}
}

func TestIsEmailAlreadyUsed(t *testing.T) {
	for _, tt := range isEmailAlreadyUsedCases() {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsEmailAlreadyUsed(tt.err); got != tt.want {
				t.Errorf("IsEmailAlreadyUsed(%v) = %v, want %v", tt.err, got, tt.want)
			}
		})
	}
}
