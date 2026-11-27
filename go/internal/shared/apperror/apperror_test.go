package apperror

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"testing"
)

func TestConstructors(t *testing.T) {
	cause := errors.New("db down")

	tests := []struct {
		name        string
		err         AppError
		wantMessage string
		wantStatus  int
		wantLevel   slog.Level
		wantCause   error
	}{
		{
			name:        "NewNotFoundは404とInfoを返す",
			err:         NewNotFound("user not found"),
			wantMessage: "user not found",
			wantStatus:  http.StatusNotFound,
			wantLevel:   slog.LevelInfo,
		},
		{
			name:        "NewInternalは500とErrorを返し原因を隠す",
			err:         NewInternal(cause),
			wantMessage: "internal server error",
			wantStatus:  http.StatusInternalServerError,
			wantLevel:   slog.LevelError,
			wantCause:   cause,
		},
		{
			name:        "NewValidationは422とInfoを返す",
			err:         NewValidation([]FieldError{{Field: "name", Message: "required"}}),
			wantMessage: "validation failed: 1 field(s)",
			wantStatus:  http.StatusUnprocessableEntity,
			wantLevel:   slog.LevelInfo,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.err.Error(); got != tt.wantMessage {
				t.Errorf("Error() = %q, want %q", got, tt.wantMessage)
			}

			if got := tt.err.StatusCode(); got != tt.wantStatus {
				t.Errorf("StatusCode() = %d, want %d", got, tt.wantStatus)
			}

			if got := tt.err.LogLevel(); got != tt.wantLevel {
				t.Errorf("LogLevel() = %v, want %v", got, tt.wantLevel)
			}

			if tt.wantCause != nil && !errors.Is(tt.err, tt.wantCause) {
				t.Errorf("errors.Is(err, cause) = false, want true")
			}
		})
	}
}

func TestAppError_ErrorsAs(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
	}{
		{
			name:       "そのまま渡してもAppErrorとして判定できる",
			err:        NewNotFound("x"),
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "fmt.ErrorfでラップしてもAppErrorとして判定できる",
			err:        fmt.Errorf("wrap: %w", NewInternal(errors.New("boom"))),
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var appErr AppError
			if !errors.As(tt.err, &appErr) {
				t.Fatalf("errors.As() = false, want true")
			}

			if appErr.StatusCode() != tt.wantStatus {
				t.Errorf("StatusCode() = %d, want %d", appErr.StatusCode(), tt.wantStatus)
			}
		})
	}
}

func TestValidationError_Fields(t *testing.T) {
	fields := []FieldError{
		{Field: "name", Message: "required"},
		{Field: "email", Message: "invalid"},
	}

	var fieldErr FieldErrorer
	if !errors.As(fmt.Errorf("wrap: %w", NewValidation(fields)), &fieldErr) {
		t.Fatalf("errors.As(FieldErrorer) = false, want true")
	}

	got := fieldErr.Fields()
	if len(got) != len(fields) {
		t.Fatalf("len(Fields()) = %d, want %d", len(got), len(fields))
	}

	for i := range fields {
		if got[i] != fields[i] {
			t.Errorf("Fields()[%d] = %+v, want %+v", i, got[i], fields[i])
		}
	}

	var notFieldErr FieldErrorer
	if errors.As(NewNotFound("x"), &notFieldErr) {
		t.Errorf("NewNotFound is FieldErrorer, want not")
	}
}
