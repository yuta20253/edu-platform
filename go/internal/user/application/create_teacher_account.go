package application

import (
	"context"

	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
)

// CreateTeacherAccount は教員アカウント本体を、指定された初期状態で作成します。
// PendingInvitation・SendInvitationEmail は必須で、nil の場合は
// ErrPendingInvitationRequired・ErrSendInvitationEmailRequired を返します。
// SendInvitationEmail が真のときは、送信依頼を作成と同じトランザクションで jobs へ登録します。
// ctx にトランザクションがあればそれに参加します。
func (s *Service) CreateTeacherAccount(
	ctx context.Context,
	in CreateTeacherAccountInput,
) (UserAttributes, error) {
	if in.PendingInvitation == nil {
		return UserAttributes{}, ErrPendingInvitationRequired
	}

	if in.SendInvitationEmail == nil {
		return UserAttributes{}, ErrSendInvitationEmailRequired
	}

	email := normalizeEmail(in.Email)

	var v validationErrors

	validateNameLength(&v, fieldName, in.Name)
	validateNameLength(&v, fieldNameKana, in.NameKana)

	if err := s.validateEmail(ctx, &v, email); err != nil {
		return UserAttributes{}, err
	}

	if in.HighSchoolID == 0 {
		v.add(fieldHighSchoolID, msgRequired)
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
		Name:                   &in.Name,
		NameKana:               &in.NameKana,
		RoleName:               roleNames[RoleTeacher],
		HighSchoolID:           &in.HighSchoolID,
		GradeID:                in.GradeID,
		EncryptedPassword:      cred.encryptedPassword,
		JTI:                    cred.jti,
		PasswordResetRequired:  *in.PendingInvitation,
		EnqueueInvitationEmail: *in.SendInvitationEmail,
	}

	id, err := s.createUser(ctx, p)
	if err != nil {
		return UserAttributes{}, err
	}

	return createdAttributes(id, RoleTeacher, p), nil
}
