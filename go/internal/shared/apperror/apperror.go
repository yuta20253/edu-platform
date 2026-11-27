// Package apperror はHTTPステータスとログレベルを持つApplication層のエラー型を提供します。
package apperror

import (
	"fmt"
	"log/slog"
	"net/http"
)

// AppError はHTTPステータスとログレベルを持つエラーです。
type AppError interface {
	error
	StatusCode() int
	LogLevel() slog.Level
}

// FieldError は1つの入力項目に対するエラーの詳細です。
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// FieldErrorer は AppError に加えて項目ごとのエラー詳細を持つ場合に実装します。
type FieldErrorer interface {
	Fields() []FieldError
}

// Messages は AppError に加えて複数のメッセージを持つ場合に実装します。
type Messages interface {
	Messages() []string
}

const internalMessage = "internal server error"

type appError struct {
	message string
	status  int
	level   slog.Level
	cause   error
}

func (e *appError) Error() string { return e.message }

func (e *appError) StatusCode() int { return e.status }

func (e *appError) LogLevel() slog.Level { return e.level }

func (e *appError) Unwrap() error { return e.cause }

// NewNotFound は対象が存在しないことを表す404のAppErrorを返します。
func NewNotFound(message string) AppError {
	return &appError{message: message, status: http.StatusNotFound, level: slog.LevelInfo}
}

// NewInternal は想定外の失敗を表す500のAppErrorを返します。
// 利用者に返すメッセージには原因を含めず、原因は errors.Is / errors.As で辿れます。
func NewInternal(cause error) AppError {
	return &appError{
		message: internalMessage,
		status:  http.StatusInternalServerError,
		level:   slog.LevelError,
		cause:   cause,
	}
}

// ValidationError は複数項目の入力検証エラーを表す422のAppErrorです。
type ValidationError struct {
	fields []FieldError
}

// NewValidation は項目ごとのエラーを持つ ValidationError を返します。
func NewValidation(fields []FieldError) *ValidationError {
	return &ValidationError{fields: fields}
}

// Error は ValidationError のメッセージを返します。
func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation failed: %d field(s)", len(e.fields))
}

// StatusCode は422を返します。
func (e *ValidationError) StatusCode() int { return http.StatusUnprocessableEntity }

// LogLevel は slog.LevelInfo を返します。
func (e *ValidationError) LogLevel() slog.Level { return slog.LevelInfo }

// Fields は項目ごとのエラー詳細を返します。
func (e *ValidationError) Fields() []FieldError { return e.fields }
