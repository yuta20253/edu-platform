# frozen_string_literal: true

module Common
  class CreateInterviewCancelledNotificationService
    def initialize(interview_request:)
      @interview_request = interview_request
    end

    def call
      Teacher::CreateSystemAnnouncementService.new(
        publisher: @interview_request.cancelled_by,
        title: '面談がキャンセルされました',
        content: content,
        announcement_targets: [
          { 'target_type' => 'by_user', 'user_id' => recipient_id }
        ]
      ).call
    end

    private

    def recipient_id
      if @interview_request.cancelled_by_id == @interview_request.student_id
        @interview_request.teacher_id
      else
        @interview_request.student_id
      end
    end

    def content
      base = '面談がキャンセルされました。'
      return base if @interview_request.cancel_reason.blank?

      "#{base}理由: #{@interview_request.cancel_reason}"
    end
  end
end
