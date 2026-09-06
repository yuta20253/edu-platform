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
      case @status
      when 'confirmed'
        (interview_request.requested? || interview_request.scheduling?) && @scheduled_at.present?
      when 'completed'
        interview_request.confirmed?
      else
        false
      end
    end

    def update_attributes
      attributes = { status: @status, lock_version: @lock_version || interview_request.lock_version }
      attributes[:scheduled_at] = @scheduled_at if @status == 'confirmed'
      attributes[:completed_at] = Time.current if @status == 'completed'
      attributes
    end

    def notify_confirmed
      Common::CreateInterviewConfirmedNotificationService.new(interview_request: interview_request).call
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
