# frozen_string_literal: true

module Auth
  class ChangePasswordService
    def initialize(form)
      @form = form
    end

    def call
      raise ValidationError, @form.errors.full_messages unless @form.valid?

      user = User.reset_password_by_token(
        reset_password_token: @form.reset_password_token,
        password: @form.password,
        password_confirmation: @form.password_confirmation
      )

      raise ValidationError, user.errors.full_messages if user.errors.any?

      user.update!(password_reset_required: false) if user.teacher?

      'パスワードを更新しました。'
    end
  end
end
