# frozen_string_literal: true

module Teacher
  class CreateSchoolClassRequestNotificationService
    def initialize(user:)
      @user = user
    end

    def call
      Teacher::CreateAnnouncementService.new(
        publisher: @user,
        title: 'クラス作成申請',
        content: "#{@user.name}先生からクラス作成申請があります。",
        announcement_targets: notification_targets
      ).call
    end

    private

    def notification_targets
      notification_teachers.map do |teacher|
        {
          'target_type' => 'by_user',
          'user_id' => teacher.id
        }
      end
    end

    def notification_teachers
      User
        .teachers
        .where(high_school_id: @user.high_school.id)
        .joins(:teacher_permission)
        .where(teacher_permissions: { manage_other_teachers: true })
    end
  end
end
