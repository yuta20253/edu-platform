# frozen_string_literal: true

module Student
  class TaskStartService
    def initialize(user:, task:)
      @user = user
      @task = task
    end

    def call
      return unless @task.not_started?

      ::Student::TaskStatusUpdaterService.new(
        user: @user,
        task_id: @task.id,
        status: :in_progress
      ).call

      update_goal_status
    end

    private

    def update_goal_status
      goal_status = ::Student::GoalCompletionService.new(
        user: @user,
        goal_id: @task.goal_id
      ).call

      ::Student::GoalStatusUpdaterService.new(
        user: @user,
        goal_id: @task.goal_id,
        status: goal_status
      ).call
    end
  end
end
