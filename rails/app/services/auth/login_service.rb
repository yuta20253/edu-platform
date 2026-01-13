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

      user
    end
  end
end
