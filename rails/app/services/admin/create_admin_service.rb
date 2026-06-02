# frozen_string_literal: true

module Admin
  class CreateAdminService
    def initialize(name:, email:)
      @name = name
      @email = email
    end

    def call
      ActiveRecord::Base.transaction do
        role = UserRole.find_or_create_by!(name: :admin)
        password = SecureRandom.hex(16)
        user = User.create!(
          name: @name.presence || @email.to_s.split('@').first,
          email: @email,
          password: password,
          password_confirmation: password,
          user_role: role,
          password_reset_required: true
        )

        token = user.send(:set_reset_password_token)
        AuthMailer.invite_teacher(user, token).deliver_later

        user
      end
    end
  end
end
