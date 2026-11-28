package application

import (
	"log/slog"

	"gorm.io/gorm"

	"github.com/yuta20253/edu-platform/go/internal/shared/jobqueue"
)

// Service は公開操作の実装です。依存を保持します。
type Service struct {
	db               *gorm.DB
	logger           *slog.Logger
	jobPublisher     jobqueue.JobPublisher
	tokenIssuer      TokenIssuer
	schoolCodeReader SchoolCodeReader
	mailer           Mailer
	// studentNumberCode は生徒番号のコード本体（学校コードに続く8桁）を生成します。
	studentNumberCode func() (string, error)
}

// NewService は Service を返します。
func NewService(
	db *gorm.DB,
	logger *slog.Logger,
	jobPublisher jobqueue.JobPublisher,
	tokenIssuer TokenIssuer,
	schoolCodeReader SchoolCodeReader,
	mailer Mailer,
) *Service {
	return &Service{
		db:                db,
		logger:            logger,
		jobPublisher:      jobPublisher,
		tokenIssuer:       tokenIssuer,
		schoolCodeReader:  schoolCodeReader,
		mailer:            mailer,
		studentNumberCode: randomStudentNumberCode,
	}
}
