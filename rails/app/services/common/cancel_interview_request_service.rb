# frozen_string_literal: true

module Common
  class CancelInterviewRequestService
    def initialize(interview_request:, cancelled_by:, reason: nil, lock_version: nil)
      @interview_request = interview_request
      @cancelled_by = cancelled_by
      @reason = reason
      @lock_version = lock_version
    end

    def call
      return false unless @interview_request.active?

      @interview_request.update!(
        status: :cancelled,
        cancelled_at: Time.current,
        cancelled_by_id: @cancelled_by.id,
        cancel_reason: @reason,
        lock_version: @lock_version || @interview_request.lock_version
      )

      notify_cancelled

      true
    end

    private

    def notify_cancelled
      Common::CreateInterviewCancelledNotificationJob.perform_later(interview_request_id: @interview_request.id)
    end
  end
end
