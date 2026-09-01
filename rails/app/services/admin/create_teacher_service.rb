# frozen_string_literal: true

module Admin
  class CreateTeacherService
    def initialize(school:, name:, email:, password:, grade_scope:, manage_other_teachers:, grade_ids:)
      @school = school
      @name = name
      @email = email
      @password = password
      @grade_scope = grade_scope
      @manage_other_teachers = manage_other_teachers
      @grade_ids = grade_ids
    end

    def call
      ActiveRecord::Base.transaction do
        teacher_role = UserRole.find_or_create_by!(name: :teacher)
        user = User.create!(
          name: @name,
          # フォームにカナ入力欄が無いため、User#validates :name_kana の
          # presence(on: :update)を後続の編集(PATCH)で満たせるよう name と同値を設定しておく
          name_kana: @name,
          email: @email,
          password: @password,
          password_confirmation: @password,
          user_role: teacher_role,
          high_school: @school
        )

        user.create_teacher_permission!(
          grade_scope: @grade_scope,
          manage_other_teachers: @manage_other_teachers
        )

        @grade_ids.each { |grade_id| user.teacher_grades.create!(grade_id: grade_id) }

        user.reload
      end
    end
  end
end
