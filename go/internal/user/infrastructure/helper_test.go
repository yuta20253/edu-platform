package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue/worker"
)

// testLockName は users・jobs を使うテストを、パッケージをまたいで逐次実行するための名前付きロックです。
// go test ./... はパッケージを並行に実行するため、jobqueue/worker のテストと同じ名前のロックを取得します。
const testLockName = "edu_platform_jobs_users_test"

// Railsのスキーマが無い（CIの空のDB）場合に、外部キーの参照先として使う最小限のテーブルです。
var referenceTableDDL = []string{
	"CREATE TABLE IF NOT EXISTS prefectures (id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
		"name varchar(255) NOT NULL, created_at datetime(6) NOT NULL, updated_at datetime(6) NOT NULL)",
	"CREATE TABLE IF NOT EXISTS high_schools (id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
		"name varchar(50) NOT NULL, prefecture_id bigint NOT NULL, school_code varchar(255), " +
		"created_at datetime(6) NOT NULL, updated_at datetime(6) NOT NULL)",
	"CREATE TABLE IF NOT EXISTS grades (id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
		"high_school_id bigint NOT NULL, year int NOT NULL, " +
		"created_at datetime(6) NOT NULL, updated_at datetime(6) NOT NULL)",
	"CREATE TABLE IF NOT EXISTS school_classes (id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
		"grade_id bigint NOT NULL, name varchar(255) NOT NULL, " +
		"created_at datetime(6) NOT NULL, updated_at datetime(6) NOT NULL)",
}

// testRefs はテストで作成した参照先の行のIDです。
type testRefs struct {
	roleIDs     map[int32]uint
	highSchoolA uint
	highSchoolB uint
	gradeA1     uint
	gradeA2     uint
	gradeB1     uint
	classA1     uint
}

func openTestDB(t *testing.T, translateError bool) *gorm.DB {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_DSN")
	if !strings.Contains(dsn, "test") {
		t.Fatalf("TEST_DATABASE_DSNがテスト用DBを指していません: %q", dsn)
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Silent),
		TranslateError: translateError,
	})
	if err != nil {
		t.Fatalf("テスト用DBへの接続に失敗しました: %v", err)
	}

	return db
}

// setupTestDB はテスト用DBに接続し、users・user_roles を初期化して、参照先の行を用意します。
func setupTestDB(t *testing.T) (*gorm.DB, testRefs) {
	t.Helper()

	db := openTestDB(t, false)
	lockTestDB(t, db)

	if err := MigrateForTest(db); err != nil {
		t.Fatalf("MigrateForTestに失敗しました: %v", err)
	}

	if err := db.AutoMigrate(&worker.Job{}); err != nil {
		t.Fatalf("jobsのAutoMigrateに失敗しました: %v", err)
	}

	for _, ddl := range referenceTableDDL {
		mustExec(t, db, ddl)
	}

	resetUsers(t, db)
	t.Cleanup(func() { resetUsers(t, db) })

	return db, createRefs(t, db)
}

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

func resetUsers(t *testing.T, db *gorm.DB) {
	t.Helper()

	mustExec(t, db, "DELETE FROM jobs WHERE type = ?", "user_invitation_email")
	mustExec(t, db, "DELETE FROM users")
	mustExec(t, db, "DELETE FROM user_roles")
}

func mustExec(t *testing.T, db *gorm.DB, query string, args ...any) {
	t.Helper()

	if err := db.Exec(query, args...).Error; err != nil {
		t.Fatalf("SQLの実行に失敗しました(%s): %v", query, err)
	}
}

func mustInsert(t *testing.T, db *gorm.DB, query string, args ...any) uint {
	t.Helper()

	res := db.Exec(query, args...)
	if res.Error != nil {
		t.Fatalf("行の作成に失敗しました(%s): %v", query, res.Error)
	}

	var id uint
	if err := db.Raw("SELECT LAST_INSERT_ID()").Scan(&id).Error; err != nil {
		t.Fatalf("作成した行のIDの取得に失敗しました: %v", err)
	}

	return id
}

// createRefs は役割4件と、高校2校・学年3件・クラス1件を作成します。
// 高校以下の行はテストの終了時に削除します（他のテストの行は消しません）。
func createRefs(t *testing.T, db *gorm.DB) testRefs {
	t.Helper()

	now := time.Now().UTC()
	refs := testRefs{roleIDs: map[int32]uint{}}

	for _, name := range []int32{0, 1, 2, 3} {
		refs.roleIDs[name] = mustInsert(t, db,
			"INSERT INTO user_roles (name, created_at, updated_at) VALUES (?, ?, ?)", name, now, now)
	}

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	pref := mustInsert(t, db,
		"INSERT INTO prefectures (name, created_at, updated_at) VALUES (?, ?, ?)",
		"テスト県"+suffix, now, now)

	hs := func(name, code string) uint {
		return mustInsert(t, db, "INSERT INTO high_schools "+
			"(name, prefecture_id, school_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			name+suffix[len(suffix)-8:], pref, code+suffix[len(suffix)-8:], now, now)
	}
	grade := func(hsID uint, year int) uint {
		return mustInsert(t, db, "INSERT INTO grades (high_school_id, year, created_at, updated_at) "+
			"VALUES (?, ?, ?, ?)", hsID, year, now, now)
	}

	refs.highSchoolA = hs("A高校", "A")
	refs.highSchoolB = hs("B高校", "B")
	refs.gradeA1 = grade(refs.highSchoolA, 1)
	refs.gradeA2 = grade(refs.highSchoolA, 2)
	refs.gradeB1 = grade(refs.highSchoolB, 1)
	refs.classA1 = mustInsert(t, db,
		"INSERT INTO school_classes (grade_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
		refs.gradeA1, "1組", now, now)

	t.Cleanup(func() {
		mustExec(t, db, "DELETE FROM users")
		mustExec(t, db, "DELETE FROM school_classes WHERE id = ?", refs.classA1)
		mustExec(t, db, "DELETE FROM grades WHERE id IN ?",
			[]uint{refs.gradeA1, refs.gradeA2, refs.gradeB1})
		mustExec(t, db, "DELETE FROM high_schools WHERE id IN ?",
			[]uint{refs.highSchoolA, refs.highSchoolB})
		mustExec(t, db, "DELETE FROM prefectures WHERE id = ?", pref)
	})

	return refs
}

func ptr[T any](v T) *T { return &v }

func mustCreateUser(t *testing.T, db *gorm.DB, m userModel) userModel {
	t.Helper()

	if m.JTI == "" {
		m.JTI = fmt.Sprintf("jti-%s-%d", m.Email, time.Now().UnixNano())
	}

	if m.EncryptedPassword == "" {
		m.EncryptedPassword = "hashed"
	}

	if err := db.Create(&m).Error; err != nil {
		t.Fatalf("ユーザーの作成に失敗しました: %v", err)
	}

	return m
}
