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
      @interview_request.other_party_id(@message.sender_id)
    end
  end
end
