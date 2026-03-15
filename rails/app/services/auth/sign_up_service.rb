# frozen_string_literal: true

module Auth
  class SignUpService
    class SignUpError < StandardError; end

    def initialize(form)
      @form = form
    end

    def call
      ActiveRecord::Base.transaction do
        role = UserRole.find_by(name: @form.user_role_name)
        raise SignUpError, '無効なユーザーロールです' unless role

        high_school = nil
        if role.student? || role.teacher?
          high_school = HighSchool.find_by(name: @form.school_name)
          raise SignUpError, '学校が見つかりません' unless high_school
          grade = Grade.find_by(id: @form.grade_id, high_school_id: high_school.id)
          raise SignUpError, '学年が見つかりません' unless grade
        end

        user = User.create!(@form.to_attributes.merge(user_role_id: role.id, high_school: high_school,
                                                      grade_id: @form.grade_id))

        user
      end
    end
  end
end
