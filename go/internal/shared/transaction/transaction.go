// Package transaction は複数の書き込みを1つのトランザクションで実行するための
// インターフェースを提供します。GORMへの依存は gormtx パッケージに閉じます。
package transaction

import "context"

// TransactionManager は fn の実行を1つのトランザクションにまとめます。
// fn に渡す ctx にはトランザクションが保持され、既にトランザクションが
// 始まっている ctx で呼ばれた場合はそれに参加します。
type TransactionManager interface {
	WithinTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}
