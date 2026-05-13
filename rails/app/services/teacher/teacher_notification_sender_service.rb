# frozen_string_literal: true

module Teacher
  class TeacherNotificationSenderService
    def initialize(user:, teacher_ids:)
      @user = user
      @teacher_ids = teacher_ids
    end

    def call
      Teacher::TeacherNotificationJob.perform_later(
        sender_user_id: @user.id,
        teacher_ids: @teacher_ids
      )
    end
  end
end
