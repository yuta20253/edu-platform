# frozen_string_literal: true

module Student
  class SubmissionService
    def initialize(user:, task_id:)
      @user = user
      @task_id = task_id
    end

    def call
      status = ::Student::TaskCompletionService.new(
        user: @user,
        task_id: @task_id
      ).call

      ::Student::TaskStatusUpdaterService.new(
        user: @user,
        task_id: @task_id,
        status: status
      ).call

      status
    end
  end
end
