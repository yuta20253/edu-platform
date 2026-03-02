# frozen_string_literal: true

module Auth
  class ResetPasswordService
    def initialize(user)
      @user = user
    end

    def call
      return if @user.nil?

      token = @user.send(:set_reset_password_token)
      SendResetPasswordEmailJob.perform_later(@user.id, token)
    end
  end
end
