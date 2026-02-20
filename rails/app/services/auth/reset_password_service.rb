class Auth::ResetPasswordService
  def initialize(user)
    @user = user
  end

  def call
    return if @user.nil?

    token = @user.send(:set_reset_password_token)
    SendResetPasswordEmailJob.perform_later(@user.id, token)

  rescue StandardError => e
    Rails.logger.error "[PasswordReset] Failed for user_id: #{@user&.id} error: #{e.class} message: #{e.message}"
  end
end
