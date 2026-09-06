# frozen_string_literal: true

module Common
  class CreateInterviewCancelledNotificationJob < ApplicationJob
    queue_as :default

    def perform(interview_request_id:)
      interview_request = InterviewRequest.find(interview_request_id)

      Common::CreateInterviewCancelledNotificationService.new(interview_request: interview_request).call
    end
  end
end
