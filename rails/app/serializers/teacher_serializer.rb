# frozen_string_literal: true

class TeacherSerializer < ActiveModel::Serializer
  attributes :id, :name, :name_kana, :grade, :invitation_status

  belongs_to :grade, serializer: GradeSerializer
  has_one :teacher_permission, serializer: TeacherPermissionSerializer

  def invitation_status
    latest = instance_options[:latest_notifications]&.dig(object.id)&.first
    latest&.status || 'pending'
  end
end
