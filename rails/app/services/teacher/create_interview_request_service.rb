# frozen_string_literal: true

module Teacher
  class CreateInterviewRequestService
    def initialize(user:, student_id:, reason_detail:)
      @user = user
      @student_id = student_id
      @reason_detail = reason_detail
    end

    def call
      interview_request = create_interview_request
      notify_created(interview_request)
      interview_request
    end

    private

    def create_interview_request
      InterviewRequest.create!(
        student_id: @student_id,
        teacher: @user,
        initiator: @user,
        initiator_role: :teacher,
        reason_detail: @reason_detail,
        status: :requested
      )
    end

    def notify_created(interview_request)
      ::Common::CreateInterviewRequestNotificationJob.perform_later(interview_request_id: interview_request.id)
    end
  end
end
