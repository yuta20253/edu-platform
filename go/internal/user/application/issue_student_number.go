package application

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
)

const (
	// maxStudentNumberAttempts は生徒番号の発行の試行回数の上限です（実行計画書 U-7）。
	maxStudentNumberAttempts = 10
	// studentNumberCodeLength は学校コードに続くコード本体の桁数です（Rails現行と同じ8桁）。
	studentNumberCodeLength = 8
	studentNumberDelimiter  = "-"
	studentNumberAlphabet   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

var errStudentNumberExhausted = errors.New("生徒番号の発行が上限回数を超えました")

// IssueStudentNumber は生徒に一意の生徒番号を割り当てます。
// 書式は「高校の学校コード-8桁の英数字大文字」で、既存の全ユーザー（論理削除済みを含む）と
// 重複しなくなるまで再発行します。学校コードを取得できない場合・上限を超えた場合は内部エラーです。
func (s *Service) IssueStudentNumber(ctx context.Context, highSchoolID uint) (string, error) {
	schoolCode, err := s.schoolCodeReader.FindSchoolCode(ctx, highSchoolID)
	if err != nil {
		return "", apperror.NewInternal(
			fmt.Errorf("高校(id=%d)の学校コードの取得に失敗しました: %w", highSchoolID, err))
	}

	if schoolCode == "" {
		return "", apperror.NewInternal(
			fmt.Errorf("高校(id=%d)の学校コードが設定されていません", highSchoolID))
	}

	for range maxStudentNumberAttempts {
		code, genErr := s.studentNumberCode()
		if genErr != nil {
			return "", apperror.NewInternal(genErr)
		}

		number := schoolCode + studentNumberDelimiter + code

		exists, existsErr := infrastructure.StudentNumberExists(ctx, s.db, number)
		if existsErr != nil {
			return "", apperror.NewInternal(existsErr)
		}

		if !exists {
			return number, nil
		}
	}

	return "", apperror.NewInternal(errStudentNumberExhausted)
}

// randomStudentNumberCode は8桁の英数字大文字を crypto/rand で生成します。
func randomStudentNumberCode() (string, error) {
	limit := big.NewInt(int64(len(studentNumberAlphabet)))
	code := make([]byte, studentNumberCodeLength)

	for i := range code {
		n, err := rand.Int(rand.Reader, limit)
		if err != nil {
			return "", fmt.Errorf("生徒番号の生成に失敗しました: %w", err)
		}

		code[i] = studentNumberAlphabet[n.Int64()]
	}

	return string(code), nil
}
