# frozen_string_literal: true

module Common
  class CreateInterviewRequestMessageNotificationJob < ApplicationJob
    queue_as :default

    def perform(interview_request_message_id:)
      message = InterviewRequestMessage.find(interview_request_message_id)

      Common::CreateInterviewRequestMessageNotificationService.new(message: message).call
    end
  end
end
