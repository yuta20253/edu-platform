# frozen_string_literal: true

module Admin
  class UpdateTeacherService
    def initialize(user:, params:)
      @user = user
      @params = params
    end

    def call
      ActiveRecord::Base.transaction do
        update_user_attributes
        update_permission_attributes
        update_teacher_grades

        @user.reload
      end
    end

    private

    def update_user_attributes
      user_attrs = @params.slice(:name, :email).compact
      @user.update!(user_attrs) if user_attrs.present?
    end

    def update_permission_attributes
      permission_attrs = @params.slice(:grade_scope, :manage_other_teachers).compact
      @user.teacher_permission.update!(permission_attrs) if permission_attrs.present?
    end

    def update_teacher_grades
      return unless @params.key?(:grade_ids)

      @user.teacher_grades.destroy_all
      @params[:grade_ids].each { |grade_id| @user.teacher_grades.create!(grade_id: grade_id) }
    end
  end
end
