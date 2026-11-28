package infrastructure

import (
	"fmt"

	"gorm.io/gorm"
)

// MigrateForTest はテスト用に users・user_roles のテーブルを AutoMigrate で用意します。
// application のテストが使います。本番コードからは呼びません（Gorm規約「7. マイグレーション」）。
func MigrateForTest(db *gorm.DB) error {
	if err := db.AutoMigrate(&userRoleModel{}, &userModel{}); err != nil {
		return fmt.Errorf("テスト用テーブルの作成に失敗しました: %w", err)
	}

	return nil
}
