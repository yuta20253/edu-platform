package application

import (
	"context"
	"regexp"
	"strings"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
)

// emailPattern はメールアドレスの形式です（Rails現行の Devise.email_regexp と同じ）。
var emailPattern = regexp.MustCompile(`^[^@\s]+@[^@\s]+$`)

// normalizeEmail は前後の空白を除去し小文字化します。
func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// FindUserByEmail はメールアドレスに一致するユーザーを1件取得します。
// 照合前に前後の空白を除去し小文字化します。該当しない場合、形式が不正な場合は found が false です。
// 無効化済みのユーザーも対象とします。email が空（空白のみを含む）の場合は ErrLookupEmailRequired を返します。
func (s *Service) FindUserByEmail(
	ctx context.Context,
	email string,
) (attrs UserAttributes, found bool, err error) {
	normalized := normalizeEmail(email)
	if normalized == "" {
		return UserAttributes{}, false, ErrLookupEmailRequired
	}

	if !emailPattern.MatchString(normalized) {
		return UserAttributes{}, false, nil
	}

	row, found, err := infrastructure.FindUserByEmail(ctx, s.db, normalized)
	if err != nil {
		return UserAttributes{}, false, apperror.NewInternal(err)
	}

	if !found {
		return UserAttributes{}, false, nil
	}

	attrs, err = toUserAttributes(row)
	if err != nil {
		return UserAttributes{}, false, err
	}

	return attrs, true, nil
}
