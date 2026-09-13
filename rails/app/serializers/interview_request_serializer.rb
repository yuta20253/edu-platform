# frozen_string_literal: true

# == Schema Information
#
# Table name: interview_requests
#
#  id              :bigint           not null, primary key
#  student_id      :bigint           not null
#  teacher_id      :bigint           not null
#  initiator_id    :bigint           not null
#  initiator_role  :integer          not null
#  status          :integer          default("requested"), not null
#  reason_category :integer
#  reason_detail   :text(65535)      not null
#  scheduled_at    :datetime
#  completed_at    :datetime
#  cancelled_at    :datetime
#  cancelled_by_id :bigint
#  cancel_reason   :text(65535)
#  lock_version    :integer          default(0), not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  active_pair_key :string(255)
#
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
