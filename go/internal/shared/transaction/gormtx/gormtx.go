// Package gormtx は transaction.TransactionManager のGORM実装と、
// ctxを通じてトランザクションを引き継ぐためのヘルパーを提供します。
package gormtx

import (
	"context"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/transaction"
)

type ctxKeyTx struct{}

type transactionManager struct {
	db *gorm.DB
}

// NewTransactionManager は GORM を用いた TransactionManager を返します。
func NewTransactionManager(db *gorm.DB) transaction.TransactionManager {
	return &transactionManager{db: db}
}

// WithinTransaction は TransactionManager の実装です。
// トランザクションの開始・参加の判定は RunInTx に委ねます。
func (m *transactionManager) WithinTransaction(
	ctx context.Context,
	fn func(ctx context.Context) error,
) error {
	return RunInTx(ctx, m.db, func(ctx context.Context, _ *gorm.DB) error {
		return fn(ctx)
	})
}

// RunInTx は、ctxにトランザクションがあればそれに参加し、なければ新しく開始して fn を実行します。
// 参加する場合は Commit・Rollback を行いません。
func RunInTx(
	ctx context.Context,
	db *gorm.DB,
	fn func(ctx context.Context, tx *gorm.DB) error,
) error {
	if tx, ok := txFromContext(ctx); ok {
		return fn(ctx, tx)
	}

	return db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(context.WithValue(ctx, ctxKeyTx{}, tx), tx)
	})
}

func txFromContext(ctx context.Context) (*gorm.DB, bool) {
	tx, ok := ctx.Value(ctxKeyTx{}).(*gorm.DB)

	return tx, ok
}

// DBFromContext は、トランザクション中であればそのtxを、そうでなければ通常の db を返します。
// Repository実装はこの関数を通してDBコネクションを取得します。
func DBFromContext(ctx context.Context, db *gorm.DB) *gorm.DB {
	if tx, ok := txFromContext(ctx); ok {
		return tx
	}

	return db.WithContext(ctx)
}
