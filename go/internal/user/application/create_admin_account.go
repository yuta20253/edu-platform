package application

import (
	"context"
	"strings"

	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
)

// CreateAdminAccount は管理者アカウント本体を、招待待ちで作成し招待メールの送信を依頼します。
// Name が空（空白のみを含む）の場合はメールアドレスの @ より前の部分を氏名とします。
// 氏名カナ・所属校・学年・クラス・生徒番号は設定しません。
// ctx にトランザクションがあればそれに参加します。
func (s *Service) CreateAdminAccount(
	ctx context.Context,
	in CreateAdminAccountInput,
) (UserAttributes, error) {
	name := in.Name
	if strings.TrimSpace(name) == "" {
		// Rails現行（Admin::CreateAdminService）と同じく、正規化前の入力値の @ より前を使う
		name, _, _ = strings.Cut(in.Email, "@")
	}

	email := normalizeEmail(in.Email)

	var v validationErrors

	validateNameLength(&v, fieldName, name)

	if err := s.validateEmail(ctx, &v, email); err != nil {
		return UserAttributes{}, err
	}

	if err := v.err(); err != nil {
		return UserAttributes{}, err
	}

	cred, err := newCredentials()
	if err != nil {
		return UserAttributes{}, err
	}

	p := infrastructure.CreateUserParams{
		Email:                  email,
		Name:                   &name,
		RoleName:               roleNames[RoleAdmin],
		EncryptedPassword:      cred.encryptedPassword,
		JTI:                    cred.jti,
		PasswordResetRequired:  true,
		EnqueueInvitationEmail: true,
	}

	id, err := s.createUser(ctx, p)
	if err != nil {
		return UserAttributes{}, err
	}

	return createdAttributes(id, RoleAdmin, p), nil
}
