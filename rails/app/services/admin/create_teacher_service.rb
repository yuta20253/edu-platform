# frozen_string_literal: true

module Admin
  class CreateTeacherService < Common::CreateUserService
    def initialize(school:, attributes:)
      super()
      @school = school
      @attributes = attributes
    end

    private

    def role_name
      :teacher
    end

    def build_user(role, password)
      user = User.new(
        name: @attributes[:name],
        # フォームにカナ入力欄が無いため、User#validates :name_kana の
        # presence(on: :update)を後続の編集(PATCH)で満たせるよう name と同値を設定しておく
        name_kana: @attributes[:name],
        email: @attributes[:email],
        user_role: role,
        high_school: @school,
        password: password,
        password_confirmation: password
      )
      # User#validates :name の presence は on: :update のみのため、作成時にも
      # 明示的にチェックする(フォームの必須入力を素通しでAPIを叩かれた場合の防御)
      user.errors.add(:name, :blank) if user.name.blank?
      raise ActiveRecord::RecordInvalid, user if user.errors.any?

      user
    end

    def after_create(user)
      user.create_teacher_permission!(
        grade_scope: @attributes[:grade_scope],
        manage_other_teachers: @attributes[:manage_other_teachers]
      )

      # 対象校に属さない学年IDが紛れ込んでも無視する(他校の学年に紐付けられないようにする)
      valid_grade_ids = @school.grades.where(id: Array(@attributes[:grade_ids])).pluck(:id)
      valid_grade_ids.each { |grade_id| user.teacher_grades.create!(grade_id: grade_id) }
    end
  end
end
