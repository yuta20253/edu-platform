package application

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"log/slog"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue/worker"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
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

// setupTestDB はテスト用DBに接続し、users・user_roles を初期化して、参照先の行を用意します。
func setupTestDB(t *testing.T) (*gorm.DB, testRefs) {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_DSN")
	if !strings.Contains(dsn, "test") {
		t.Fatalf("TEST_DATABASE_DSNがテスト用DBを指していません: %q", dsn)
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatalf("テスト用DBへの接続に失敗しました: %v", err)
	}

	lockTestDB(t, db)

	if err := infrastructure.MigrateForTest(db); err != nil {
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

	if err := db.Exec(query, args...).Error; err != nil {
		t.Fatalf("行の作成に失敗しました(%s): %v", query, err)
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

// userSeed はテストで直接作成するユーザーです。
type userSeed struct {
	email         string
	name          *string
	nameKana      *string
	roleID        uint
	highSchoolID  *uint
	gradeID       *uint
	schoolClassID *uint
	studentNumber *string
	pending       bool
	deactivated   bool
}

func mustInsertUser(t *testing.T, db *gorm.DB, s userSeed) uint {
	t.Helper()

	now := time.Now().UTC()

	var deletedAt *time.Time
	if s.deactivated {
		deletedAt = &now
	}

	return mustInsert(t, db, "INSERT INTO users (email, encrypted_password, name, name_kana, "+
		"user_role_id, jti, deleted_at, created_at, updated_at, high_school_id, grade_id, "+
		"password_reset_required, school_class_id, student_number) "+
		"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		s.email, "hashed", s.name, s.nameKana, s.roleID, "jti-"+s.email, deletedAt, now, now,
		s.highSchoolID, s.gradeID, s.pending, s.schoolClassID, s.studentNumber)
}

func ptr[T any](v T) *T { return &v }

func discardLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

// stubTokenIssuer は固定のトークンを発行するスタブです。
type stubTokenIssuer struct {
	mu     sync.Mutex
	token  string
	err    error
	issued []uint
}

func (s *stubTokenIssuer) IssueInvitationToken(_ context.Context, userID uint) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.issued = append(s.issued, userID)

	return s.token, s.err
}

// stubSchoolCodeReader は高校IDごとの学校コードを返すスタブです。未登録の高校はエラーです。
type stubSchoolCodeReader struct {
	codes map[uint]string
}

func (s *stubSchoolCodeReader) FindSchoolCode(
	_ context.Context,
	highSchoolID uint,
) (string, error) {
	code, ok := s.codes[highSchoolID]
	if !ok {
		return "", fmt.Errorf("高校(id=%d)の学校コードがありません", highSchoolID)
	}

	return code, nil
}

type sentMail struct {
	to, token string
}

// stubMailer は送信内容を記録するスタブです。
type stubMailer struct {
	mu   sync.Mutex
	err  error
	sent []sentMail
}

func (s *stubMailer) SendInvitationEmail(_ context.Context, to string, rawToken string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.err != nil {
		return s.err
	}

	s.sent = append(s.sent, sentMail{to: to, token: rawToken})

	return nil
}

// testDeps はテスト用の Service と、その依存のスタブです。
type testDeps struct {
	svc         *Service
	tokenIssuer *stubTokenIssuer
	schoolCodes *stubSchoolCodeReader
	mailer      *stubMailer
}

func newTestService(db *gorm.DB, refs testRefs) testDeps {
	d := testDeps{
		tokenIssuer: &stubTokenIssuer{token: "raw-token"},
		schoolCodes: &stubSchoolCodeReader{codes: map[uint]string{
			refs.highSchoolA: "SCHA", refs.highSchoolB: "SCHB",
		}},
		mailer: &stubMailer{},
	}
	d.svc = NewService(db, discardLogger(), worker.NewPublisher(db),
		d.tokenIssuer, d.schoolCodes, d.mailer)

	return d
}
