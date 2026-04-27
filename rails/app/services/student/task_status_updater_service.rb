# frozen_string_literal: true

module Student
  class TaskStatusUpdaterService
    def initialize(user:, task_id:, status:)
      @user = user
      @task_id = task_id
      @status = status
    end

    def call
      task.update!(
        status: @status,
        completed_at: completed_at
      )
    end

    private

    def task
      @task ||= @user.tasks.find(@task_id)
    end

    def completed_at
      @status == :completed ? Time.current : nil
    end
  end
end
