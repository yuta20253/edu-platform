# frozen_string_literal: true

module Student
  class CreateInterviewRequestService
    def initialize(user:, teacher_id:, reason_category:, reason_detail:)
      @user = user
      @teacher_id = teacher_id
      @reason_category = reason_category
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
        student: @user,
        teacher_id: @teacher_id,
        initiator: @user,
        initiator_role: :student,
        reason_category: @reason_category,
        reason_detail: @reason_detail,
        status: :requested
      )
    end

    def notify_created(interview_request)
      ::Common::CreateInterviewRequestNotificationJob.perform_later(
        interview_request_id: interview_request.id
      )
    end
  end
end
