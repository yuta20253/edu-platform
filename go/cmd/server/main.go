// Command server はAPIサーバーを起動します。
package main

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
	gormmysql "gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/config"
	"github.com/yuta20253/edu-platform/go/internal/shared/middleware"
)

const productionEnv = "production"

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to load config:", err)
		os.Exit(1)
	}

	logger, err := newLogger(cfg, os.Stdout)
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to create logger:", err)
		os.Exit(1)
	}

	if _, err := connectDB(buildDSN(cfg)); err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	router := newRouter(logger)

	if err := router.Run(":" + cfg.Port); err != nil {
		logger.Error("failed to run server", "error", err)
		os.Exit(1)
	}
}

// newLogger は APP_ENV が production なら JSON 形式、それ以外は Text 形式のロガーを返します。
// LOG_LEVEL が空の場合は Info とします。
func newLogger(cfg *config.Config, w io.Writer) (*slog.Logger, error) {
	level := slog.LevelInfo
	if cfg.LogLevel != "" {
		if err := level.UnmarshalText([]byte(cfg.LogLevel)); err != nil {
			return nil, fmt.Errorf("LOG_LEVELの解釈に失敗しました: %w", err)
		}
	}

	opts := &slog.HandlerOptions{Level: level}

	if cfg.AppEnv == productionEnv {
		return slog.New(slog.NewJSONHandler(w, opts)), nil
	}

	return slog.New(slog.NewTextHandler(w, opts)), nil
}

// buildDSN は Gorm規約に従い、parseTime=true と loc=UTC を指定したDSNを組み立てます。
func buildDSN(cfg *config.Config) string {
	c := mysql.NewConfig()
	c.User = cfg.DBUser
	c.Passwd = cfg.DBPassword
	c.Net = "tcp"
	c.Addr = fmt.Sprintf("%s:%d", cfg.DBHost, cfg.DBPort)
	c.DBName = cfg.DBName
	c.ParseTime = true
	c.Loc = time.UTC
	// Locは既定値(UTC)のときFormatDSNが出力しないため、Gorm規約のとおりloc=UTCをParamsで明示する
	c.Params = map[string]string{"charset": "utf8mb4", "loc": "UTC"}

	return c.FormatDSN()
}

// connectDB はMySQLへ接続し、Pingで疎通を確認します。
func connectDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(gormmysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("データベースへの接続に失敗しました: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("データベース接続の取得に失敗しました: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("データベースへのPingに失敗しました: %w", err)
	}

	return db, nil
}

// newRouter は共通ミドルウェアのみを登録したルーターを返します。
// ErrorHandler は AccessLogger の次に登録します。CORSミドルウェアは登録しません。
func newRouter(logger *slog.Logger) *gin.Engine {
	router := gin.New()
	router.Use(
		middleware.AccessLogger(logger),
		middleware.ErrorHandler(logger),
	)

	return router
}
