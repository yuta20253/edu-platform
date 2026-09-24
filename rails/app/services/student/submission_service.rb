# frozen_string_literal: true

module Student
  class SubmissionService
    def initialize(user:, task_id:)
      @user = user
      @task_id = task_id
    end

    def call
      ActiveRecord::Base.transaction do
        status = ::Student::TaskCompletionService.new(
          user: @user,
          task_id: @task_id
        ).call

        ::Student::TaskStatusUpdaterService.new(
          user: @user,
          task_id: @task_id,
          status: status
        ).call

        update_goal_status

        status
      end
    end

    private

    def update_goal_status
      goal_status = ::Student::GoalCompletionService.new(
        user: @user,
        goal_id: task.goal_id
      ).call

      ::Student::GoalStatusUpdaterService.new(
        user: @user,
        goal_id: task.goal_id,
        status: goal_status
      ).call
    end

    def task
      @task ||= @user.tasks.find(@task_id)
    end
  end
end
