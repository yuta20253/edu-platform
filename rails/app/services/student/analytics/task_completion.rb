# frozen_string_literal: true

module Student
  module Analytics
    class TaskCompletion
      def initialize(user, from: nil, to: nil)
        @user = user
        @from = from
        @to = to
      end

      def call
        task_stats = TaskStats.new(@user, from: @from, to: @to)

        completed_count = task_stats.completed_count
        total_count = task_stats.total_count
        {
          completed_count: completed_count,
          total_count: total_count,
          completion_rate: Calculator.completion_rate(completed_count, total_count)
        }
      end
    end
  end
end
