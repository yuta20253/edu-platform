# frozen_string_literal: true

module Teacher
  class TeacherNotificationJob < ApplicationJob
    queue_as :default

    def perform(sender_user_id:, teacher_ids:)
      sender = User.find(sender_user_id)
      target_teachers = User.where(id: teacher_ids)

      target_teachers.each do |target_teacher|
        token = target_teacher.send(:set_reset_password_token)
        AuthMailer.invite_teacher(target_teacher, token).deliver_now

        TeacherNotification.create!(
          sender_user: sender,
          receiver_user: target_teacher,
          email: target_teacher.email,
          sent_at: Time.current,
          status: 'sent'
        )
      rescue StandardError => e
        Rails.logger.error(
          message: 'TeacherNotification failed',
          error: e.full_message,
          teacher_id: target_teacher.id
        )

        TeacherNotification.create!(
          sender_user: sender,
          receiver_user: target_teacher,
          email: target_teacher.email,
          status: 'failed'
        )
      end
    end
  end
end
