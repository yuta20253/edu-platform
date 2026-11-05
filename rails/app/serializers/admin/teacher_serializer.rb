# frozen_string_literal: true

module Admin
  class TeacherSerializer < ActiveModel::Serializer
    attributes :id, :name, :email, :grade_scope, :manage_other_teachers, :grades, :permission_lock_version

    def grade_scope
      object.teacher_permission&.grade_scope
    end

    def manage_other_teachers
      object.teacher_permission&.manage_other_teachers
    end

    def grades
      object.grades.map { |g| { id: g.id, name: g.display_name } }
    end

    def permission_lock_version
      object.teacher_permission&.lock_version
    end
  end
end
