# frozen_string_literal: true

class TeacherSerializer < ActiveModel::Serializer
  attributes :id, :name, :name_kana, :grade

  belongs_to :grade, serializer: GradeSerializer
  has_one :teacher_permission, serializer: TeacherPermissionSerializer
end
