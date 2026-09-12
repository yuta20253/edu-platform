# frozen_string_literal: true

module Student
  class CancelInterviewRequestService
    def initialize(user:, id:, reason: nil, lock_version: nil)
      @user = user
      @interview_request_id = id
      @reason = reason
      @lock_version = lock_version
    end

    def call
      Common::CancelInterviewRequestService.new(
        interview_request: interview_request,
        cancelled_by: @user,
        reason: @reason,
        lock_version: @lock_version
      ).call
    end

    private

    def interview_request
      @interview_request ||= InterviewRequest.for_participant(@user).find_by!(id: @interview_request_id)
    end
  end
end
