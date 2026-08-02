# frozen_string_literal: true

class TeacherSerializer < ActiveModel::Serializer
  attributes :id, :name, :name_kana, :grade, :invitation_status

  belongs_to :grade, serializer: GradeSerializer
  has_one :teacher_permission, serializer: TeacherPermissionSerializer

  def invitation_status
    latest = object.received_teacher_notifications.order(sent_at: :desc).limit(1).first
    latest ? latest.status : 'not_sent'
  end
end
