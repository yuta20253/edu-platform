package application

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"unicode/utf8"

	"github.com/yuta20253/edu-platform/go/internal/shared/apperror"
	"github.com/yuta20253/edu-platform/go/internal/shared/password"
	"github.com/yuta20253/edu-platform/go/internal/user/infrastructure"
)

const (
	// maxNameLength は氏名・氏名カナの最大文字数です（users.name・name_kana の limit）。
	maxNameLength = 100
	// maxEmailLength はメールアドレスの最大文字数です（users.email の limit）。
	maxEmailLength = 255
	// temporaryPasswordBytes は仮パスワードの乱数のバイト数です（128bit。Rails現行の SecureRandom.hex(16) 相当）。
	temporaryPasswordBytes = 16
)

// CreateStudentAccount は生徒アカウント本体を作成し、招待メールの送信を依頼します。
// 生徒番号は本Contextが発行します。常に招待待ちで作成し、送信依頼を同じトランザクションで jobs へ登録します。
// ctx にトランザクションがあればそれに参加します。
func (s *Service) CreateStudentAccount(
	ctx context.Context,
	in CreateStudentAccountInput,
) (UserAttributes, error) {
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

	if in.GradeID == 0 {
		v.add(fieldGradeID, msgRequired)
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
		RoleName:               roleNames[RoleStudent],
		HighSchoolID:           &in.HighSchoolID,
		GradeID:                &in.GradeID,
		SchoolClassID:          in.SchoolClassID,
		EncryptedPassword:      cred.encryptedPassword,
		JTI:                    cred.jti,
		PasswordResetRequired:  true,
		EnqueueInvitationEmail: true,
	}

	id, number, err := s.createStudent(ctx, p, in.HighSchoolID)
	if err != nil {
		return UserAttributes{}, err
	}

	p.StudentNumber = &number

	return createdAttributes(id, RoleStudent, p), nil
}

// createStudent は生徒番号を発行して作成します。保存時に生徒番号の一意制約に違反した場合
// （発行後に他の作成が同じ番号を使った場合）は、エラーにせず再発行して作成し直します。
func (s *Service) createStudent(
	ctx context.Context,
	p infrastructure.CreateUserParams,
	highSchoolID uint,
) (uint, string, error) {
	for range maxStudentNumberAttempts {
		number, err := s.IssueStudentNumber(ctx, highSchoolID)
		if err != nil {
			return 0, "", err
		}

		p.StudentNumber = &number

		id, err := s.createUser(ctx, p)
		if errors.Is(err, infrastructure.ErrStudentNumberTaken) {
			continue
		}

		if err != nil {
			return 0, "", err
		}

		return id, number, nil
	}

	return 0, "", apperror.NewInternal(errStudentNumberExhausted)
}

// createUser は infrastructure の作成を呼び、メールアドレスの一意制約違反を email の taken に変換します。
// 生徒番号の一意制約違反はそのまま返します（呼び出し側が再発行の契機にする）。
func (s *Service) createUser(ctx context.Context, p infrastructure.CreateUserParams) (uint, error) {
	id, err := infrastructure.CreateUser(ctx, s.db, s.jobPublisher, p)

	switch {
	case err == nil:
		return id, nil
	case errors.Is(err, infrastructure.ErrEmailTaken):
		var v validationErrors
		v.add(fieldEmail, msgTaken)

		return 0, v.err()
	case errors.Is(err, infrastructure.ErrStudentNumberTaken):
		return 0, err
	default:
		return 0, apperror.NewInternal(err)
	}
}

func validateNameLength(v *validationErrors, field, value string) {
	if utf8.RuneCountInString(value) > maxNameLength {
		v.add(field, msgTooLong)
	}
}

// validateEmail は正規化済みのメールアドレスを検証します。空なら required のみ、
// 空でなければ形式・文字数・使用済み（論理削除済みを含む）を打ち切らずに検証します。
func (s *Service) validateEmail(ctx context.Context, v *validationErrors, email string) error {
	if email == "" {
		v.add(fieldEmail, msgRequired)
		return nil
	}

	if !emailPattern.MatchString(email) {
		v.add(fieldEmail, msgInvalid)
	}

	if utf8.RuneCountInString(email) > maxEmailLength {
		v.add(fieldEmail, msgTooLong)
	}

	_, found, err := infrastructure.FindUserByEmail(ctx, s.db, email)
	if err != nil {
		return apperror.NewInternal(err)
	}

	if found {
		v.add(fieldEmail, msgTaken)
	}

	return nil
}

// credentials は作成時に設定する仮パスワードのハッシュと jti です。
type credentials struct {
	encryptedPassword string
	jti               string
}

// newCredentials は仮パスワード（128bitの乱数）を発行してハッシュ化し、jti（UUID v4）を生成します。
func newCredentials() (credentials, error) {
	raw := make([]byte, temporaryPasswordBytes)
	if _, err := rand.Read(raw); err != nil {
		return credentials{}, apperror.NewInternal(fmt.Errorf("仮パスワードの生成に失敗しました: %w", err))
	}

	hashed, err := password.Hash(hex.EncodeToString(raw))
	if err != nil {
		return credentials{}, apperror.NewInternal(err)
	}

	jti, err := newUUIDv4()
	if err != nil {
		return credentials{}, apperror.NewInternal(err)
	}

	return credentials{encryptedPassword: hashed, jti: jti}, nil
}

// newUUIDv4 はUUID v4の文字列を生成します（Rails現行の SecureRandom.uuid 相当）。
func newUUIDv4() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("jtiの生成に失敗しました: %w", err)
	}

	b[6] = (b[6] & 0x0f) | 0x40 // バージョン4
	b[8] = (b[8] & 0x3f) | 0x80 // バリアント（RFC 4122）

	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}

// createdAttributes は作成した値から UserAttributes を組み立てます。
func createdAttributes(id uint, role Role, p infrastructure.CreateUserParams) UserAttributes {
	return UserAttributes{
		ID:                  id,
		Email:               p.Email,
		Name:                derefString(p.Name),
		NameKana:            derefString(p.NameKana),
		Role:                role,
		HighSchoolID:        p.HighSchoolID,
		GradeID:             p.GradeID,
		SchoolClassID:       p.SchoolClassID,
		StudentNumber:       p.StudentNumber,
		InvitationCompleted: !p.PasswordResetRequired,
	}
}
