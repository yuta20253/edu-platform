# frozen_string_literal: true

module Teacher
  class ProcessInterviewRequestService
    def initialize(user:, id:, status:, lock_version: nil, scheduled_at: nil)
      @user = user
      @interview_request_id = id
      @status = status
      @lock_version = lock_version
      @scheduled_at = scheduled_at
    end

    def call
      return false unless allowed_transition?

      interview_request.update!(update_attributes)
      notify_confirmed if @status == 'confirmed'

      true
    end

    private

    def allowed_transition?
      return false unless InterviewRequest::STATUS_TRANSITIONS[interview_request.status].include?(@status)
      return @scheduled_at.present? if @status == 'confirmed'

      true
    end

    def update_attributes
      attributes = { status: @status, lock_version: @lock_version || interview_request.lock_version }
      attributes[:scheduled_at] = @scheduled_at if @status == 'confirmed'
      attributes[:completed_at] = Time.current if @status == 'completed'
      attributes
    end

    def notify_confirmed
      Common::CreateInterviewConfirmedNotificationJob.perform_later(interview_request_id: interview_request.id)
    end

    def interview_request
      @interview_request ||=
        InterviewRequest.find_by!(
          id: @interview_request_id,
          teacher_id: @user.id
        )
    end
  end
end
