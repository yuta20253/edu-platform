# frozen_string_literal: true

module Admin
  class CreateAdminService < Common::CreateUserService
    def initialize(name:, email:)
      super()
      @name = name
      @email = email
    end

    private

    def role_name
      :admin
    end

    def build_user(role, password)
      User.new(
        name: @name.presence || @email.to_s.split('@').first,
        email: @email,
        user_role: role,
        password: password,
        password_confirmation: password,
        password_reset_required: true
      )
    end
  end
end
