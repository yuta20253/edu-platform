class Auth::LoginService
  class LoginError < StandardError; end
  class JWTError < StandardError; end

  def initialize(form)
    @form = form
  end

  def call
    user = User.find_by!(email: @form.email)

    unless user&.valid_password?(@form.password)
      raise Auth::LoginService::LoginError, "メールアドレスまたはパスワードが違います"
    end

    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first

    if token.blank?
      raise Auth::LoginService::JWTError, "トークン生成に失敗しました"
    end

    [ user, token ]
  end
end
