# frozen_string_literal: true

module Admin
  class CreateTeacherService
    def initialize(school:, email:)
      @school = school
      @email = email
    end

    def call
      ActiveRecord::Base.transaction do
        teacher_role = UserRole.find_or_create_by!(name: :teacher)
        password = SecureRandom.hex(16)
        user = User.create!(
          name: @email.split('@').first,
          email: @email,
          password: password,
          password_confirmation: password,
          user_role: teacher_role,
          high_school: @school
        )

        user.create_teacher_permission!(grade_scope: :own_grade, manage_other_teachers: true)

        token = user.send(:set_reset_password_token)
        AuthMailer.invite_teacher(user, token).deliver_later

        user.reload
      end
    end
  end
end
