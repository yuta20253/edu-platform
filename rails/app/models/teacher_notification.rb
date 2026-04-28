# frozen_string_literal: true

class TeacherNotification < ApplicationRecord
  belongs_to :sender_user, class_name: 'User', inverse_of: :sent_teacher_notifications
  belongs_to :receiver_user, class_name: 'User', inverse_of: :received_teacher_notifications

  enum status: {
    pending: 'pending',
    sent: 'sent',
    failed: 'failed',
    expired: 'expired'
  }

  validates :email, presence: true
end
