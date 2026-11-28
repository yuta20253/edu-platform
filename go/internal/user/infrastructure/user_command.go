package infrastructure

import (
	"context"
	"errors"
	"fmt"
	"strings"

	mysqldriver "github.com/go-sql-driver/mysql"
	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue"
	"github.com/yuta20253/edu-platform/go/internal/shared/transaction/gormtx"
)

// 作成時のエラーです。application が業務上のエラーへ変換します。
var (
	ErrEmailTaken         = errors.New("users.email の一意制約に違反しました")
	ErrStudentNumberTaken = errors.New("users.student_number の一意制約に違反しました")
	ErrRoleNotFound       = errors.New("user_roles に該当のロールがありません")
)

// mysqlDuplicateEntry はMySQLの一意制約違反のエラー番号です。
const mysqlDuplicateEntry = 1062

// CreateUserParams は作成時に本Contextが設定する列です。
// 他Contextが所有する列（address_id・activated_at・deleted_at など）は持ちません。
type CreateUserParams struct {
	Email                 string
	Name                  *string
	NameKana              *string
	RoleName              int32 // user_roles.name の整数
	HighSchoolID          *uint
	GradeID               *uint
	SchoolClassID         *uint
	StudentNumber         *string
	EncryptedPassword     string
	JTI                   string
	PasswordResetRequired bool
	// EnqueueInvitationEmail が真のとき、作成と同じトランザクションで招待メール送信依頼を登録します。
	EnqueueInvitationEmail bool
}

// CreateUser はユーザーを作成し、指定があれば招待メール送信依頼を同じトランザクションで登録します。
// ctx にトランザクションがあればそれに参加します。作成したユーザーのIDを返します。
func CreateUser(
	ctx context.Context,
	db *gorm.DB,
	publisher jobqueue.JobPublisher,
	p CreateUserParams,
) (uint, error) {
	var id uint

	err := gormtx.RunInTx(ctx, db, func(ctx context.Context, tx *gorm.DB) error {
		roleID, err := findRoleID(tx, p.RoleName)
		if err != nil {
			return err
		}

		m := userModel{
			Email:                 p.Email,
			Name:                  p.Name,
			NameKana:              p.NameKana,
			UserRoleID:            &roleID,
			HighSchoolID:          p.HighSchoolID,
			GradeID:               p.GradeID,
			SchoolClassID:         p.SchoolClassID,
			StudentNumber:         p.StudentNumber,
			EncryptedPassword:     p.EncryptedPassword,
			JTI:                   p.JTI,
			PasswordResetRequired: p.PasswordResetRequired,
		}

		if err := tx.Create(&m).Error; err != nil {
			if dupErr := classifyDuplicate(tx, err, p); dupErr != nil {
				return dupErr
			}

			return fmt.Errorf("ユーザーの作成に失敗しました: %w", err)
		}

		id = m.ID

		if !p.EnqueueInvitationEmail {
			return nil
		}

		// fn が受け取った ctx（トランザクションを積んだもの）を渡し、作成と同じトランザクションで登録する
		return enqueueInvitationEmail(ctx, publisher, m.ID)
	})
	if err != nil {
		return 0, err
	}

	return id, nil
}

func findRoleID(tx *gorm.DB, roleName int32) (uint, error) {
	var ids []uint

	if err := tx.Model(&userRoleModel{}).Where("name = ?", roleName).
		Limit(1).Pluck("id", &ids).Error; err != nil {
		return 0, fmt.Errorf("ロールの取得に失敗しました: %w", err)
	}

	if len(ids) == 0 {
		return 0, fmt.Errorf("%w (name=%d)", ErrRoleNotFound, roleName)
	}

	return ids[0], nil
}

// classifyDuplicate は一意制約違反のエラーを ErrEmailTaken・ErrStudentNumberTaken に変換します。
// 一意制約違反でない、またはどちらの列か判別できない場合は nil を返します。
func classifyDuplicate(tx *gorm.DB, err error, p CreateUserParams) error {
	var myErr *mysqldriver.MySQLError
	if errors.As(err, &myErr) {
		if myErr.Number != mysqlDuplicateEntry {
			return nil
		}

		switch {
		case strings.Contains(myErr.Message, "index_users_on_email"):
			return ErrEmailTaken
		case strings.Contains(myErr.Message, "index_users_on_student_number"):
			return ErrStudentNumberTaken
		default:
			return nil
		}
	}

	if !errors.Is(err, gorm.ErrDuplicatedKey) {
		return nil
	}

	// TranslateError 有効時は違反した制約名が失われるため、行の有無で判別する（Gorm規約「9.」）
	return classifyDuplicateByRows(tx, p)
}

func classifyDuplicateByRows(tx *gorm.DB, p CreateUserParams) error {
	if exists, err := columnValueExists(tx, "email", p.Email); err != nil || exists {
		return errOr(err, ErrEmailTaken)
	}

	if p.StudentNumber == nil {
		return nil
	}

	if exists, err := columnValueExists(tx, "student_number", *p.StudentNumber); err != nil || exists {
		return errOr(err, ErrStudentNumberTaken)
	}

	return nil
}

func columnValueExists(tx *gorm.DB, column, value string) (bool, error) {
	var n int64

	if err := tx.Model(&userModel{}).Where(column+" = ?", value).Count(&n).Error; err != nil {
		return false, fmt.Errorf("一意制約違反の判別に失敗しました: %w", err)
	}

	return n > 0, nil
}

func errOr(err, fallback error) error {
	if err != nil {
		return err
	}

	return fallback
}
