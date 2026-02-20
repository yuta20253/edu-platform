# frozen_string_literal: true

class AuthMailer < Devise::Mailer
  default from: 'no-reply@example.com'
  layout 'mailer'

  def send_email(user, token)
    url = "#{ENV.fetch('FRONTEND_URL', nil)}/password/reset/#{token}?email=#{user.email}"
    mail(to: user.email, subject: 'パスワード再設定のご案内', body: "パスワード再設定はこちらのリンクからお願いします： #{url}")
  end
end
