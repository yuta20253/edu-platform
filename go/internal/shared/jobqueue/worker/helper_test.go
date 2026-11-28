package worker

import (
	"context"
	"database/sql"
	"io"
	"log/slog"
	"os"
	"strings"
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// testLockName は jobs・users を使うテストを、パッケージをまたいで逐次実行するための名前付きロックです。
// go test ./... はパッケージを並行に実行するため、jobs を使う user Context のテストと同じ名前のロックを取得します。
const testLockName = "edu_platform_jobs_users_test"

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

	lockTestDB(t, db)

	if err := db.AutoMigrate(&Job{}); err != nil {
		t.Fatalf("AutoMigrateに失敗しました: %v", err)
	}

	if err := db.Exec("DELETE FROM jobs").Error; err != nil {
		t.Fatalf("テストデータの初期化に失敗しました: %v", err)
	}

	return db
}

// lockTestDB は名前付きロックを取得し、テストの終了時に解放します。
// ロックはDB接続単位のため、取得した接続を解放まで保持します。
func lockTestDB(t *testing.T, db *gorm.DB) {
	t.Helper()

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("DB接続の取得に失敗しました: %v", err)
	}

	conn, err := sqlDB.Conn(context.Background())
	if err != nil {
		t.Fatalf("DB接続の取得に失敗しました: %v", err)
	}

	var got sql.NullInt64
	if err := conn.QueryRowContext(context.Background(), "SELECT GET_LOCK(?, 120)",
		testLockName).Scan(&got); err != nil || got.Int64 != 1 {
		t.Fatalf("テスト用ロックの取得に失敗しました: %v (%v)", err, got)
	}

	t.Cleanup(func() {
		_, _ = conn.ExecContext(context.Background(), "SELECT RELEASE_LOCK(?)", testLockName)
		_ = conn.Close()
	})
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
