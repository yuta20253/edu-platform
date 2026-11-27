package gormtx

import (
	"context"
	"errors"
	"os"
	"strings"
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type txTestRecord struct {
	ID   uint
	Name string
}

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

	if err := db.AutoMigrate(&txTestRecord{}); err != nil {
		t.Fatalf("AutoMigrateに失敗しました: %v", err)
	}

	if err := db.Exec("DELETE FROM tx_test_records").Error; err != nil {
		t.Fatalf("テストデータの初期化に失敗しました: %v", err)
	}

	return db
}

func countRecords(t *testing.T, db *gorm.DB) int64 {
	t.Helper()

	var n int64
	if err := db.Model(&txTestRecord{}).Count(&n).Error; err != nil {
		t.Fatalf("Countに失敗しました: %v", err)
	}

	return n
}

var errBoom = errors.New("boom")

type withinTransactionCase struct {
	name      string
	run       func(ctx context.Context, m *transactionManager, db *gorm.DB) error
	wantErr   error
	wantCount int64
}

func withinTransactionCases() []withinTransactionCase {
	return append(singleCases(), nestedCases()...)
}

func singleCases() []withinTransactionCase {
	return []withinTransactionCase{
		{
			name: "fnが成功するとコミットされる",
			run: func(ctx context.Context, m *transactionManager, db *gorm.DB) error {
				return m.WithinTransaction(ctx, func(ctx context.Context) error {
					return DBFromContext(ctx, db).Create(&txTestRecord{Name: "a"}).Error
				})
			},
			wantCount: 1,
		},
		{
			name: "fnがエラーを返すとロールバックされる",
			run: func(ctx context.Context, m *transactionManager, db *gorm.DB) error {
				return m.WithinTransaction(ctx, func(ctx context.Context) error {
					if err := DBFromContext(ctx, db).Create(&txTestRecord{Name: "a"}).Error; err != nil {
						return err
					}

					return errBoom
				})
			},
			wantErr:   errBoom,
			wantCount: 0,
		},
	}
}

func nestedCases() []withinTransactionCase {
	return []withinTransactionCase{
		{
			name: "ネストした内側が成功しても外側がエラーなら全体がロールバックされる",
			run: func(ctx context.Context, m *transactionManager, db *gorm.DB) error {
				return m.WithinTransaction(ctx, func(ctx context.Context) error {
					inner := m.WithinTransaction(ctx, func(ctx context.Context) error {
						return DBFromContext(ctx, db).Create(&txTestRecord{Name: "inner"}).Error
					})
					if inner != nil {
						return inner
					}

					return errBoom
				})
			},
			wantErr:   errBoom,
			wantCount: 0,
		},
		{
			name: "ネストした内側がエラーを返すと外側の書き込みも含めてロールバックされる",
			run: func(ctx context.Context, m *transactionManager, db *gorm.DB) error {
				return m.WithinTransaction(ctx, func(ctx context.Context) error {
					if err := DBFromContext(ctx, db).Create(&txTestRecord{Name: "outer"}).Error; err != nil {
						return err
					}

					return m.WithinTransaction(ctx, func(context.Context) error {
						return errBoom
					})
				})
			},
			wantErr:   errBoom,
			wantCount: 0,
		},
		{
			name: "ネストした両方が成功するとまとめてコミットされる",
			run: func(ctx context.Context, m *transactionManager, db *gorm.DB) error {
				return m.WithinTransaction(ctx, func(ctx context.Context) error {
					if err := DBFromContext(ctx, db).Create(&txTestRecord{Name: "outer"}).Error; err != nil {
						return err
					}

					return m.WithinTransaction(ctx, func(ctx context.Context) error {
						return DBFromContext(ctx, db).Create(&txTestRecord{Name: "inner"}).Error
					})
				})
			},
			wantCount: 2,
		}}
}

func TestTransactionManager_WithinTransaction(t *testing.T) {
	for _, tt := range withinTransactionCases() {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			m, ok := NewTransactionManager(db).(*transactionManager)
			if !ok {
				t.Fatalf("NewTransactionManager() の型が想定と異なります")
			}

			err := tt.run(t.Context(), m, db)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("error = %v, want %v", err, tt.wantErr)
			}

			if got := countRecords(t, db); got != tt.wantCount {
				t.Errorf("count = %d, want %d", got, tt.wantCount)
			}
		})
	}
}

func TestRunInTx_Participation(t *testing.T) {
	db := setupTestDB(t)

	t.Run("ctxにトランザクションが無ければ新しく開始しfnのctxに積む", func(t *testing.T) {
		err := RunInTx(t.Context(), db, func(ctx context.Context, tx *gorm.DB) error {
			got, ok := txFromContext(ctx)
			if !ok {
				t.Errorf("fnに渡されたctxにトランザクションがありません")
			}

			if got != tx {
				t.Errorf("ctxのトランザクションとtxが異なります")
			}

			return nil
		})
		if err != nil {
			t.Fatalf("RunInTx() error = %v, want nil", err)
		}
	})

	t.Run("ctxにトランザクションがあれば同じtxに参加する", func(t *testing.T) {
		err := RunInTx(t.Context(), db, func(ctx context.Context, outer *gorm.DB) error {
			return RunInTx(ctx, db, func(_ context.Context, inner *gorm.DB) error {
				if inner != outer {
					t.Errorf("内側のtxが外側のtxと異なります")
				}

				return nil
			})
		})
		if err != nil {
			t.Fatalf("RunInTx() error = %v, want nil", err)
		}
	})
}

func TestDBFromContext(t *testing.T) {
	db := setupTestDB(t)

	t.Run("トランザクション外では通常のdbを返す", func(t *testing.T) {
		got := DBFromContext(t.Context(), db)
		if _, ok := txFromContext(got.Statement.Context); ok {
			t.Errorf("トランザクション外なのにtxが返りました")
		}

		if got.Statement.Context == nil {
			t.Errorf("ctxがdbに設定されていません")
		}
	})

	t.Run("トランザクション中はtxを返す", func(t *testing.T) {
		err := RunInTx(t.Context(), db, func(ctx context.Context, tx *gorm.DB) error {
			if got := DBFromContext(ctx, db); got != tx {
				t.Errorf("DBFromContext() がtxを返しません")
			}

			return nil
		})
		if err != nil {
			t.Fatalf("RunInTx() error = %v, want nil", err)
		}
	})
}
