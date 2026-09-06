# frozen_string_literal: true

module Common
  class CreateInterviewRequestNotificationService
    def initialize(interview_request:)
      @interview_request = interview_request
    end

    def call
      Teacher::CreateSystemAnnouncementService.new(
        publisher: publisher,
        title: '面談の申請があります',
        content: content,
        announcement_targets: [
          { 'target_type' => 'by_user', 'user_id' => recipient_id }
        ]
      ).call
    end

    private

    def publisher
      @interview_request.initiator
    end

    def recipient_id
      @interview_request.other_party_id(@interview_request.initiator_id)
    end

    def content
      if @interview_request.initiator_role_teacher?
        "#{@interview_request.teacher.name}先生から面談の申請がありました。"
      else
        "#{@interview_request.student.name}さんから面談の申請がありました。"
      end
    end
  end
end
