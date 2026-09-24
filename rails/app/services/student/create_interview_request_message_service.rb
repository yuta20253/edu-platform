# frozen_string_literal: true

module Student
  class CreateInterviewRequestMessageService
    def initialize(user:, interview_request_id:, body:)
      @user = user
      @interview_request_id = interview_request_id
      @body = body
    end

    def call
      Common::PostInterviewRequestMessageService.new(
        interview_request: interview_request,
        sender: @user,
        body: @body
      ).call
    end

    private

    def interview_request
      @interview_request ||= InterviewRequest.for_participant(@user).find(@interview_request_id)
    end
  end
end
