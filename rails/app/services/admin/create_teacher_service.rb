# frozen_string_literal: true

module Admin
  class CreateTeacherService
    def initialize(school:, attributes:)
      @school = school
      @attributes = attributes
    end

    def call
      ActiveRecord::Base.transaction do
        teacher_role = UserRole.find_or_create_by!(name: :teacher)
        user = User.create!(
          name: @attributes[:name],
          # フォームにカナ入力欄が無いため、User#validates :name_kana の
          # presence(on: :update)を後続の編集(PATCH)で満たせるよう name と同値を設定しておく
          name_kana: @attributes[:name],
          email: @attributes[:email],
          password: @attributes[:password],
          password_confirmation: @attributes[:password],
          user_role: teacher_role,
          high_school: @school
        )

        user.create_teacher_permission!(
          grade_scope: @attributes[:grade_scope],
          manage_other_teachers: @attributes[:manage_other_teachers]
        )

        Array(@attributes[:grade_ids]).each { |grade_id| user.teacher_grades.create!(grade_id: grade_id) }

        user.reload
      end
    end
  end
end
