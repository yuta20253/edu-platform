package main

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/yuta20253/edu-platform/go/internal/shared/config"
	"github.com/yuta20253/edu-platform/go/internal/user"
)

func TestNewLogger(t *testing.T) {
	tests := []struct {
		name      string
		appEnv    string
		logLevel  string
		wantJSON  bool
		wantDebug bool
		wantErr   bool
	}{
		{name: "productionはJSON形式", appEnv: "production", logLevel: "info", wantJSON: true},
		{name: "production以外はText形式", appEnv: "development", logLevel: "info"},
		{name: "APP_ENVが空でもText形式", appEnv: "", logLevel: "info"},
		{name: "debugを指定するとDebugが出力される", appEnv: "development", logLevel: "debug",
			wantDebug: true},
		{name: "LOG_LEVELが空ならInfoになる", appEnv: "development", logLevel: ""},
		{name: "LOG_LEVELが不正だとエラーになる", appEnv: "development", logLevel: "loud", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer

			logger, err := newLogger(&config.Config{AppEnv: tt.appEnv, LogLevel: tt.logLevel}, &buf)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("newLogger() error = nil, want error")
				}

				return
			}

			if err != nil {
				t.Fatalf("newLogger() error = %v, want nil", err)
			}

			logger.DebugContext(context.Background(), "debug message")
			logger.InfoContext(context.Background(), "info message")

			out := buf.String()

			if got := strings.HasPrefix(out, "{"); got != tt.wantJSON {
				t.Errorf("JSON形式 = %v, want %v (out=%q)", got, tt.wantJSON, out)
			}

			if got := strings.Contains(out, "debug message"); got != tt.wantDebug {
				t.Errorf("Debug出力 = %v, want %v", got, tt.wantDebug)
			}

			if !strings.Contains(out, "info message") {
				t.Errorf("Info出力がありません: %q", out)
			}
		})
	}
}

func TestBuildDSN(t *testing.T) {
	cfg := &config.Config{
		DBHost: "db", DBPort: 3306, DBUser: "root", DBPassword: "p@ss:w/rd", DBName: "myapp",
	}

	want := "root:p@ss:w/rd@tcp(db:3306)/myapp?parseTime=true&charset=utf8mb4&loc=UTC"
	if got := buildDSN(cfg); got != want {
		t.Errorf("buildDSN() = %q, want %q", got, want)
	}
}

func TestNewRouter_NoRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var buf bytes.Buffer

	router := newRouter(slog.New(slog.NewTextHandler(&buf, nil)))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/", nil))

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want %d", w.Code, http.StatusNotFound)
	}

	if !strings.Contains(buf.String(), "msg=request") {
		t.Errorf("アクセスログが出力されていません: %q", buf.String())
	}

	if routes := router.Routes(); len(routes) != 0 {
		t.Errorf("len(routes) = %d, want 0", len(routes))
	}
}

func TestConnectDB(t *testing.T) {
	testDSN := os.Getenv("TEST_DATABASE_DSN")
	if !strings.Contains(testDSN, "test") {
		t.Fatalf("TEST_DATABASE_DSNがテスト用DBを指していません: %q", testDSN)
	}

	tests := []struct {
		name    string
		dsn     string
		wantErr bool
	}{
		{name: "接続してPingに成功する", dsn: testDSN},
		{name: "接続できないとエラーになる",
			dsn: "root:password@tcp(127.0.0.1:1)/myapp_test?parseTime=true", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, err := connectDB(tt.dsn)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("connectDB() error = nil, want error")
				}

				return
			}

			if err != nil {
				t.Fatalf("connectDB() error = %v, want nil", err)
			}

			if db == nil {
				t.Fatalf("connectDB() = nil, want *gorm.DB")
			}
		})
	}
}

func TestUnimplementedDependencies(t *testing.T) {
	_, err := unimplementedTokenIssuer{}.IssueInvitationToken(t.Context(), 1)
	if !errors.Is(err, errNotImplemented) {
		t.Errorf("IssueInvitationToken() error = %v, want %v", err, errNotImplemented)
	}

	_, err = unimplementedSchoolCodeReader{}.FindSchoolCode(t.Context(), 1)
	if !errors.Is(err, errNotImplemented) {
		t.Errorf("FindSchoolCode() error = %v, want %v", err, errNotImplemented)
	}
}

func TestNewJobHandlers(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(&bytes.Buffer{}, nil))
	// ハンドラの登録のみを確認するため、DBに接続しない（payloadの解析はDBより前に行われる）
	cfg := &config.Config{FrontendURL: "http://front"}
	handlers := newJobHandlers(newUserContext(nil, logger, cfg))

	if len(handlers) != 1 {
		t.Fatalf("len(handlers) = %d, want 1", len(handlers))
	}

	handler, ok := handlers["user_invitation_email"]
	if !ok || handler == nil {
		t.Fatalf("handlers[%q] が登録されていません", user.InvitationEmailJobType)
	}

	// user の招待メール送信ハンドラであれば、payload の解析に失敗した時点でエラーを返す
	for _, payload := range []string{`{`, `{"user_id":0}`} {
		if err := handler(t.Context(), []byte(payload)); err == nil {
			t.Errorf("handler(%s) error = nil, want error", payload)
		}
	}
}
