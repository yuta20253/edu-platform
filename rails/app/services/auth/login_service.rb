# frozen_string_literal: true

module Auth
  class LoginService
    class LoginError < StandardError; end
    class JWTError < StandardError; end

    def initialize(form)
      @form = form
    end

    def call
      user = User.find_by!(email: @form.email)

      raise Auth::LoginService::LoginError, 'メールアドレスまたはパスワードが違います' unless user&.valid_password?(@form.password)

      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first

      raise Auth::LoginService::JWTError, 'トークン生成に失敗しました' if token.blank?

      [user, token]
    end
  end
end
