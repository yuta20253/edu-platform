# frozen_string_literal: true

module Student
  class GoalCompletionService
    def initialize(user:, goal_id:)
      @user = user
      @goal_id = goal_id
    end

    def call
      return :not_started if tasks.empty?
      return :completed if all_completed?
      return :in_progress if any_started?

      :not_started
    end

    private

    def goal
      @goal ||= @user.goals.find(@goal_id)
    end

    def tasks
      @tasks ||= goal.tasks.to_a
    end

    def all_completed?
      tasks.all? { |task| task.status == 'completed' }
    end

    def any_started?
      tasks.any? { |task| task.status != 'not_started' }
    end
  end
end
