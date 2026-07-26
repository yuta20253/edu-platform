# frozen_string_literal: true

module Teacher
  class UpdatePermissionForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :grade_scope
    attribute :manage_other_teachers, :boolean

    validates :grade_scope, inclusion: { in: TeacherPermission.grade_scopes.keys }
    validates :manage_other_teachers, inclusion: { in: [true, false] }

    def initialize(target:, **attributes)
      super(attributes)
      @target = target
    end

    def save
      return false unless valid?

      @target.teacher_permission.update!(
        grade_scope: grade_scope,
        manage_other_teachers: manage_other_teachers
      )

      true
    end
  end
end
