# frozen_string_literal: true

module Common
  class PostInterviewRequestMessageService
    def initialize(interview_request:, sender:, body:)
      @interview_request = interview_request
      @sender = sender
      @body = body
    end

    def call
      message = nil

      ActiveRecord::Base.transaction do
        message = @interview_request.interview_request_messages.create!(sender: @sender, body: @body)
        @interview_request.update!(status: :scheduling) if @interview_request.requested?
      end

      notify_message(message)

      message
    end

    private

    def notify_message(message)
      Common::CreateInterviewRequestMessageNotificationJob.perform_later(interview_request_message_id: message.id)
    end
  end
end
