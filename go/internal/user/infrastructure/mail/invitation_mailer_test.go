package mail

import (
	"bytes"
	"context"
	"errors"
	"log"
	"log/slog"
	"testing"
)

// recordingSender は渡されたメールを記録する Sender です。
type recordingSender struct {
	to, subject, body string
	calls             int
	err               error
}

func (s *recordingSender) Send(_ context.Context, to, subject, body string) error {
	s.calls++
	s.to, s.subject, s.body = to, subject, body

	return s.err
}

func TestInvitationMailer_SendInvitationEmail(t *testing.T) {
	sender := &recordingSender{}
	m := NewInvitationMailer("https://front.example.com", sender)

	if err := m.SendInvitationEmail(t.Context(), "taro@example.com", "raw-token"); err != nil {
		t.Fatalf("SendInvitationEmail() error = %v, want nil", err)
	}

	wantBody := "edu platform に招待されました。\n" +
		"以下のリンクからパスワードを設定してください。\n\n" +
		"https://front.example.com/password/reset/raw-token?email=taro@example.com"

	if sender.calls != 1 || sender.to != "taro@example.com" ||
		sender.subject != "edu platform へのご招待" || sender.body != wantBody {
		t.Errorf("送信内容 = {calls:%d to:%q subject:%q body:%q}, want {1 %q %q %q}",
			sender.calls, sender.to, sender.subject, sender.body,
			"taro@example.com", "edu platform へのご招待", wantBody)
	}
}

func TestInvitationMailer_SendError(t *testing.T) {
	errSend := errors.New("smtp down")
	m := NewInvitationMailer("https://front.example.com", &recordingSender{err: errSend})

	err := m.SendInvitationEmail(t.Context(), "taro@example.com", "raw-token")
	if !errors.Is(err, errSend) {
		t.Errorf("SendInvitationEmail() error = %v, want %v", err, errSend)
	}
}

func TestNopSender_Send(t *testing.T) {
	var buf bytes.Buffer

	prevDefault := slog.Default()
	prevWriter := log.Writer()

	slog.SetDefault(slog.New(slog.NewTextHandler(&buf, &slog.HandlerOptions{Level: slog.LevelDebug})))
	log.SetOutput(&buf)

	t.Cleanup(func() {
		slog.SetDefault(prevDefault)
		log.SetOutput(prevWriter)
	})

	err := NopSender{}.Send(t.Context(), "taro@example.com", "件名", "本文 raw-token")
	if err != nil {
		t.Errorf("NopSender.Send() error = %v, want nil", err)
	}

	if buf.Len() != 0 {
		t.Errorf("ログ出力 = %q, want 出力なし（宛先・件名・本文を出力しない）", buf.String())
	}
}
