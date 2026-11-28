// Package mail は招待メールの組み立てと、送信の委譲先（Sender）を提供します。
// 件名・本文・リンクはRails現行の AuthMailer#invite_user を踏襲します。
package mail

import (
	"context"
	"fmt"
)

const invitationSubject = "edu platform へのご招待"

// Sender はメールの実送信です。
type Sender interface {
	Send(ctx context.Context, to, subject, body string) error
}

// NopSender は何も送らないスタブです。宛先・件名・本文（トークン・リンクを含む）をログに出力しません。
type NopSender struct{}

// Send は何もせず nil を返します。
func (NopSender) Send(context.Context, string, string, string) error { return nil }

// InvitationMailer は招待メールを組み立て、Sender へ送信を委ねます。
type InvitationMailer struct {
	frontendURL string
	sender      Sender
}

// NewInvitationMailer は InvitationMailer を返します。frontendURL はリンクの基点です。
func NewInvitationMailer(frontendURL string, sender Sender) *InvitationMailer {
	return &InvitationMailer{frontendURL: frontendURL, sender: sender}
}

// SendInvitationEmail は件名「edu platform へのご招待」、
// リンク {frontendURL}/password/reset/{rawToken}?email={to} を含む本文を組み立て、Sender へ渡します。
func (m *InvitationMailer) SendInvitationEmail(
	ctx context.Context,
	to string,
	rawToken string,
) error {
	link := m.frontendURL + "/password/reset/" + rawToken + "?email=" + to
	body := "edu platform に招待されました。\n" +
		"以下のリンクからパスワードを設定してください。\n\n" + link

	if err := m.sender.Send(ctx, to, invitationSubject, body); err != nil {
		return fmt.Errorf("招待メールの送信に失敗しました: %w", err)
	}

	return nil
}
