# frozen_string_literal: true

module Teacher
  class CreateSchoolClassRequestService
    def initialize(user:, attributes:)
      @user = user
      @attributes = attributes
    end

    def call
      create_school_class_request
      create_school_class_request_notification
    end

    private

    def create_school_class_request
      ::SchoolClassRequest.create!(
        applicant: @user,
        grade_id: @attributes['grade_id'],
        name: @attributes['name'],
        action: @attributes['action'],
        school_class_id: @attributes['school_class_id'],
        status: :pending
      )
    end

    def create_school_class_request_notification
      ::Teacher::CreateSchoolClassRequestNotificationJob.perform_later(user_id: @user.id)
    end
  end
end
