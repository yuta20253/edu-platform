# frozen_string_literal: true

module Teacher
  class CreateSchoolClassRequestNotificationJob < ApplicationJob
    queue_as :default

    def perform(user_id:)
      user = User.find(user_id)

      Teacher::CreateSchoolClassRequestNotificationService.new(user: user).call
    end
  end
end
