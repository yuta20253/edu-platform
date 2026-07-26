# frozen_string_literal: true

module Teacher
  class TeacherPermissionManagementSerializer < ActiveModel::Serializer
    attributes :id, :name

    has_one :teacher_permission, serializer: TeacherPermissionSerializer
  end
end
