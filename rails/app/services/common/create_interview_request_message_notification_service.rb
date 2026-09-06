# frozen_string_literal: true

module Common
  class CreateInterviewRequestMessageNotificationService
    def initialize(message:)
      @message = message
      @interview_request = message.interview_request
    end

    def call
      Teacher::CreateSystemAnnouncementService.new(
        publisher: @message.sender,
        title: '面談に新しいメッセージが届いています',
        content: "#{@message.sender.name}さんからメッセージが届きました。",
        announcement_targets: [
          { 'target_type' => 'by_user', 'user_id' => recipient_id }
        ]
      ).call
    end

    private

    def recipient_id
      if @message.sender_id == @interview_request.student_id
        @interview_request.teacher_id
      else
        @interview_request.student_id
      end
    end
  end
end
