# frozen_string_literal: true

class InterviewRequestSerializer < ActiveModel::Serializer
  attributes :id, :status, :initiator_role, :reason_category, :reason_detail,
             :scheduled_at, :completed_at, :cancelled_at, :cancel_reason, :lock_version,
             :created_at, :student_id, :student_name, :teacher_id, :teacher_name

  def student_name
    object.student.name
  end

  def teacher_name
    object.teacher.name
  end
end
