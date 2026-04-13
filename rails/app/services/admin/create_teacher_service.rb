# frozen_string_literal: true

module Admin
  class CreateTeacherService
    class ValidationError < StandardError; end

    def initialize(school:, name:, email:)
      @school = school
      @name = name
      @email = email
    end

    def call
      raise ValidationError, '名前を入力してください' if @name.blank?

      ActiveRecord::Base.transaction do
        teacher_role = UserRole.find_or_create_by!(name: :teacher)
        password = SecureRandom.hex(16)
        user = User.create!(
          name: @name,
          email: @email,
          password: password,
          password_confirmation: password,
          user_role: teacher_role,
          high_school: @school
        )
        user.create_teacher_permission!(grade_scope: :own_grade, manage_other_teachers: false)
        user.send_reset_password_instructions
        user.reload
      end
    end
  end
end
