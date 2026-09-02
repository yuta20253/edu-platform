# frozen_string_literal: true

module Admin
  class CreateTeacherService < Common::CreateUserService
    def initialize(school:, email:)
      super()
      @school = school
      @email = email
    end

    private

    def role_name
      :teacher
    end

    def build_user(role, password)
      User.new(
        name: @email.split('@').first,
        email: @email,
        user_role: role,
        high_school: @school,
        password: password,
        password_confirmation: password
      )
    end

    def after_create(user)
      user.create_teacher_permission!(grade_scope: :own_grade, manage_other_teachers: true)
    end
  end
end
