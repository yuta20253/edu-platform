package middleware

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
)

type multiMessageError struct {
	msgs []string
}

func (e *multiMessageError) Error() string        { return "multiple errors" }
func (e *multiMessageError) StatusCode() int      { return http.StatusUnprocessableEntity }
func (e *multiMessageError) LogLevel() slog.Level { return slog.LevelInfo }
func (e *multiMessageError) Messages() []string   { return e.msgs }

func newJSONLogger() (*slog.Logger, *bytes.Buffer) {
	buf := &bytes.Buffer{}

	return slog.New(slog.NewJSONHandler(buf, &slog.HandlerOptions{Level: slog.LevelDebug})), buf
}

func decodeLogs(t *testing.T, buf *bytes.Buffer) []map[string]any {
	t.Helper()

	var logs []map[string]any

	dec := json.NewDecoder(buf)
	for dec.More() {
		var m map[string]any
		if err := dec.Decode(&m); err != nil {
			t.Fatalf("ログのJSON解析に失敗しました: %v", err)
		}

		logs = append(logs, m)
	}

	return logs
}

func doRequest(router *gin.Engine, method, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest(method, path, nil))

	return w
}

func TestAccessLogger(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name       string
		method     string
		path       string
		wantStatus int
	}{
		{"成功したリクエストを記録する", http.MethodGet, "/ok", http.StatusOK},
		{"未登録パスの404も記録する", http.MethodGet, "/missing", http.StatusNotFound},
		{"メソッドとパスを記録する", http.MethodPost, "/ok", http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger, buf := newJSONLogger()

			router := gin.New()
			router.Use(AccessLogger(logger))
			router.GET("/ok", func(c *gin.Context) { c.Status(http.StatusOK) })

			w := doRequest(router, tt.method, tt.path)
			if w.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", w.Code, tt.wantStatus)
			}

			logs := decodeLogs(t, buf)
			if len(logs) != 1 {
				t.Fatalf("len(logs) = %d, want 1", len(logs))
			}

			got := logs[0]
			if got["msg"] != "request" || got["level"] != "INFO" {
				t.Errorf("msg=%v level=%v, want request INFO", got["msg"], got["level"])
			}

			if got["method"] != tt.method || got["path"] != tt.path {
				t.Errorf("method=%v path=%v, want %s %s", got["method"], got["path"], tt.method, tt.path)
			}

			if got["status"] != float64(tt.wantStatus) {
				t.Errorf("status = %v, want %d", got["status"], tt.wantStatus)
			}

			if _, ok := got["duration_ms"]; !ok {
				t.Errorf("duration_ms がログにありません")
			}
		})
	}
}

type errorHandlerCase struct {
	name       string
	handler    gin.HandlerFunc
	wantStatus int
	wantBody   string
	wantLevel  string
}

func errorHandlerCases() []errorHandlerCase {
	return append(appErrorCases(), detailCases()...)
}

func appErrorCases() []errorHandlerCase {
	return []errorHandlerCase{
		{
			name:       "エラーが無ければレスポンスに介入しない",
			handler:    func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "ok"}) },
			wantStatus: http.StatusOK,
			wantBody:   `{"message":"ok"}`,
		},
		{
			name: "AppErrorはステータスとログレベルに変換される",
			handler: func(c *gin.Context) {
				_ = c.Error(apperror.NewNotFound("ユーザーが見つかりません"))
			},
			wantStatus: http.StatusNotFound,
			wantBody:   `{"errors":["ユーザーが見つかりません"]}`,
			wantLevel:  "INFO",
		},
		{
			name: "ラップされたAppErrorも判定できる",
			handler: func(c *gin.Context) {
				_ = c.Error(fmt.Errorf("wrap: %w", apperror.NewNotFound("not found")))
			},
			wantStatus: http.StatusNotFound,
			wantBody:   `{"errors":["not found"]}`,
			wantLevel:  "INFO",
		},
		{
			name: "NewInternalは原因を隠した500になる",
			handler: func(c *gin.Context) {
				_ = c.Error(apperror.NewInternal(errors.New("db password leaked")))
			},
			wantStatus: http.StatusInternalServerError,
			wantBody:   `{"errors":["internal server error"]}`,
			wantLevel:  "ERROR",
		},
		{
			name: "AppErrorでないエラーは500でErrorログになる",
			handler: func(c *gin.Context) {
				_ = c.Error(errors.New("something broke"))
			},
			wantStatus: http.StatusInternalServerError,
			wantBody:   `{"errors":["internal server error"]}`,
			wantLevel:  "ERROR",
		},
	}
}

func detailCases() []errorHandlerCase {
	return []errorHandlerCase{
		{
			name: "Messagesを実装するAppErrorはerrorsに全件を入れる",
			handler: func(c *gin.Context) {
				_ = c.Error(&multiMessageError{msgs: []string{"a is required", "b is required"}})
			},
			wantStatus: http.StatusUnprocessableEntity,
			wantBody:   `{"errors":["a is required","b is required"]}`,
			wantLevel:  "INFO",
		},
		{
			name: "FieldErrorerを実装するAppErrorはfieldsを含める",
			handler: func(c *gin.Context) {
				_ = c.Error(apperror.NewValidation([]apperror.FieldError{
					{Field: "name", Message: "required"},
				}))
			},
			wantStatus: http.StatusUnprocessableEntity,
			wantBody: `{"errors":["validation failed: 1 field(s)"],` +
				`"fields":[{"field":"name","message":"required"}]}`,
			wantLevel: "INFO",
		},
		{
			name: "複数のエラーが登録されていれば最後の1件を採用する",
			handler: func(c *gin.Context) {
				_ = c.Error(apperror.NewNotFound("first"))
				_ = c.Error(apperror.NewInternal(errors.New("last")))
			},
			wantStatus: http.StatusInternalServerError,
			wantBody:   `{"errors":["internal server error"]}`,
			wantLevel:  "ERROR",
		}}
}

func TestErrorHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	for _, tt := range errorHandlerCases() {
		t.Run(tt.name, func(t *testing.T) {
			logger, buf := newJSONLogger()

			router := gin.New()
			router.Use(ErrorHandler(logger))
			router.GET("/x", tt.handler)

			w := doRequest(router, http.MethodGet, "/x")

			if w.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", w.Code, tt.wantStatus)
			}

			if got := w.Body.String(); got != tt.wantBody {
				t.Errorf("body = %s, want %s", got, tt.wantBody)
			}

			logs := decodeLogs(t, buf)
			if tt.wantLevel == "" {
				if len(logs) != 0 {
					t.Errorf("len(logs) = %d, want 0", len(logs))
				}

				return
			}

			if len(logs) != 1 || logs[0]["level"] != tt.wantLevel {
				t.Errorf("logs = %v, want 1 entry with level %s", logs, tt.wantLevel)
			}
		})
	}
}

func TestMiddleware_Order(t *testing.T) {
	gin.SetMode(gin.TestMode)

	logger, buf := newJSONLogger()

	router := gin.New()
	router.Use(AccessLogger(logger), ErrorHandler(logger))
	router.GET("/x", func(c *gin.Context) { _ = c.Error(apperror.NewNotFound("nf")) })

	w := doRequest(router, http.MethodGet, "/x")
	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}

	logs := decodeLogs(t, buf)
	if len(logs) != 2 {
		t.Fatalf("len(logs) = %d, want 2", len(logs))
	}

	// ErrorHandlerのログが先、AccessLoggerのログ(最終ステータス入り)が後に出る
	if logs[0]["msg"] != "request failed" || logs[1]["msg"] != "request" {
		t.Errorf("msgs = [%v %v], want [request failed request]", logs[0]["msg"], logs[1]["msg"])
	}

	if logs[1]["status"] != float64(http.StatusNotFound) {
		t.Errorf("access log status = %v, want %d", logs[1]["status"], http.StatusNotFound)
	}
}

func TestErrorHandler_LogsCause(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name      string
		err       error
		wantCause string
	}{
		{"NewInternalの原因をcauseとしてログに出す",
			apperror.NewInternal(errors.New("db password leaked")), "db password leaked"},
		{"原因を持たないAppErrorにはcauseを出さない", apperror.NewNotFound("nf"), ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger, buf := newJSONLogger()

			router := gin.New()
			router.Use(ErrorHandler(logger))
			router.GET("/x", func(c *gin.Context) { _ = c.Error(tt.err) })

			w := doRequest(router, http.MethodGet, "/x")

			if strings.Contains(w.Body.String(), "db password leaked") {
				t.Errorf("レスポンスに原因が含まれています: %s", w.Body.String())
			}

			logs := decodeLogs(t, buf)
			if len(logs) != 1 {
				t.Fatalf("len(logs) = %d, want 1", len(logs))
			}

			got, hasCause := logs[0]["cause"]
			if tt.wantCause == "" {
				if hasCause {
					t.Errorf("cause = %v, want なし", got)
				}

				return
			}

			if got != tt.wantCause {
				t.Errorf("cause = %v, want %q", got, tt.wantCause)
			}
		})
	}
}
