# frozen_string_literal: true

module Common
  class CreateInterviewConfirmedNotificationService
    def initialize(interview_request:)
      @interview_request = interview_request
    end

    def call
      Teacher::CreateSystemAnnouncementService.new(
        publisher: @interview_request.teacher,
        title: '面談日程が確定しました',
        content: content,
        announcement_targets: [
          { 'target_type' => 'by_user', 'user_id' => @interview_request.student_id }
        ]
      ).call
    end

    private

    def content
      "面談日程が#{@interview_request.scheduled_at.strftime('%Y年%m月%d日 %H:%M')}に確定しました。"
    end
  end
end
