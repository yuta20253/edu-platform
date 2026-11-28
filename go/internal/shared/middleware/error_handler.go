package middleware

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

const unexpectedErrorMessage = "internal server error"

// ErrorResponse はエラーレスポンスの本文です。
type ErrorResponse struct {
	Errors []string              `json:"errors"`
	Fields []apperror.FieldError `json:"fields,omitempty"`
}

// ErrorHandler は Handler が c.Error で登録したエラーを、ログ出力とレスポンスに変換します。
// c.Errors に複数のエラーがある場合は最後の1件を採用します。
// AccessLogger の次に登録します。
func ErrorHandler(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) == 0 {
			return
		}

		err := c.Errors.Last().Err
		ctx := c.Request.Context()

		var appErr apperror.AppError
		if !errors.As(err, &appErr) {
			logger.ErrorContext(ctx, "unexpected error", "error", err)
			c.JSON(http.StatusInternalServerError,
				ErrorResponse{Errors: []string{unexpectedErrorMessage}})

			return
		}

		logger.Log(ctx, appErr.LogLevel(), "request failed", logAttrs(appErr)...)
		c.JSON(appErr.StatusCode(), newErrorResponse(err, appErr))
	}
}

// logAttrs はログに出す属性を返します。errors.Unwrap で辿れる原因がある場合は
// cause として加えます。原因はレスポンス本文には含めません。
func logAttrs(appErr apperror.AppError) []any {
	attrs := []any{"error", appErr}

	if cause := errors.Unwrap(appErr); cause != nil {
		attrs = append(attrs, "cause", cause)
	}

	return attrs
}

func newErrorResponse(err error, appErr apperror.AppError) ErrorResponse {
	resp := ErrorResponse{Errors: []string{appErr.Error()}}

	var msgsErr apperror.Messages
	if errors.As(err, &msgsErr) {
		resp.Errors = msgsErr.Messages()
	}

	var fieldErr apperror.FieldErrorer
	if errors.As(err, &fieldErr) {
		resp.Fields = fieldErr.Fields()
	}

	return resp
}
