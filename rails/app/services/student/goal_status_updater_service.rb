# frozen_string_literal: true

module Student
  class GoalStatusUpdaterService
    def initialize(user:, goal_id:, status:)
      @user = user
      @goal_id = goal_id
      @status = status
    end

    def call
      goal.update!(status: @status)
    end

    private

    def goal
      @goal ||= @user.goals.find(@goal_id)
    end
  end
end
