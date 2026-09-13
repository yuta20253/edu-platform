# frozen_string_literal: true

# == Schema Information
#
# Table name: interview_request_messages
#
#  id                   :bigint           not null, primary key
#  interview_request_id :bigint           not null
#  sender_id            :bigint           not null
#  body                 :text(65535)      not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#
class InterviewRequestMessage < ApplicationRecord
  belongs_to :interview_request
  belongs_to :sender, class_name: 'User'

  validates :body, presence: true, length: { maximum: 2000 }
  validate :sender_must_be_participant
  validate :interview_request_must_be_active

  private

  def sender_must_be_participant
    return if interview_request.blank? || sender.blank?
    return if sender_id == interview_request.student_id || sender_id == interview_request.teacher_id

    errors.add(:sender, 'は面談の当事者である必要があります')
  end

  def interview_request_must_be_active
    return if interview_request.blank? || interview_request.active?

    errors.add(:interview_request, '終了した面談にはメッセージを投稿できません')
  end
end
