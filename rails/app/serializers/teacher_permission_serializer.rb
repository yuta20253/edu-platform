# frozen_string_literal: true

class TeacherPermissionSerializer < ActiveModel::Serializer
  attributes :id, :grade_scope, :manage_other_teachers
end
