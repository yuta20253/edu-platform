# frozen_string_literal: true

# == Schema Information
#
# Table name: teacher_notifications
#
#  id               :bigint           not null, primary key
#  sender_user_id   :bigint           not null
#  receiver_user_id :bigint           not null
#  email            :string(255)      not null
#  sent_at          :datetime
#  status           :string(255)      default("pending"), not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
class TeacherNotification < ApplicationRecord
  belongs_to :sender_user, class_name: 'User', inverse_of: :sent_teacher_notifications
  belongs_to :receiver_user, class_name: 'User', inverse_of: :received_teacher_notifications

  enum status: {
    pending: 'pending',
    sent: 'sent',
    failed: 'failed'
  }

  validates :email, presence: true

  scope :sent_on, lambda { |date|
    return all if date.blank?

    where(sent_at: date.to_date.all_day)
  }
end
