# frozen_string_literal: true

class AuthMailer < Devise::Mailer
  default from: 'no-reply@example.com'
  layout 'mailer'

  def send_email(user, token)
    url = "#{ENV.fetch('FRONTEND_URL', nil)}/password/reset/#{token}"

    mail(to: user.email, subject: 'パスワード再設定のご案内', body: "パスワード再設定はこちらのリンクからお願いします： #{url}")
  end

  def invite_teacher(user, token)
    url = "#{ENV.fetch('FRONTEND_URL', nil)}/password/reset/#{token}?email=#{user.email}"

    mail(
      to: user.email,
      subject: 'edu platform へのご招待',
      body: "edu platform に招待されました。\n以下のリンクからパスワードを設定してください。\n\n#{url}"
    )
  end

  def account_claimed(user, original_email)
    mail(
      to: original_email,
      subject: '[edu platform] アカウントが有効化されました',
      body: "登録されていたアカウント(#{original_email})が、以下のメールアドレスで有効化されました。\n\n" \
            "有効化されたメールアドレス: #{user.email}\n\n" \
            'この操作に心当たりがない場合は、学校または管理者にお問い合わせください。'
    )
  end
end
