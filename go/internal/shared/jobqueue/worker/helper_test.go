package worker

import (
	"io"
	"log/slog"
	"os"
	"strings"
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_DSN")
	if !strings.Contains(dsn, "test") {
		t.Fatalf("TEST_DATABASE_DSNがテスト用DBを指していません: %q", dsn)
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("テスト用DBへの接続に失敗しました: %v", err)
	}

	if err := db.AutoMigrate(&Job{}); err != nil {
		t.Fatalf("AutoMigrateに失敗しました: %v", err)
	}

	if err := db.Exec("DELETE FROM jobs").Error; err != nil {
		t.Fatalf("テストデータの初期化に失敗しました: %v", err)
	}

	return db
}

func discardLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func mustFindJob(t *testing.T, db *gorm.DB, id uint) Job {
	t.Helper()

	var job Job
	if err := db.First(&job, id).Error; err != nil {
		t.Fatalf("ジョブ(id=%d)の取得に失敗しました: %v", id, err)
	}

	return job
}

func mustCreateJob(t *testing.T, db *gorm.DB, job Job) Job {
	t.Helper()

	if err := db.Create(&job).Error; err != nil {
		t.Fatalf("ジョブの作成に失敗しました: %v", err)
	}

	return job
}
