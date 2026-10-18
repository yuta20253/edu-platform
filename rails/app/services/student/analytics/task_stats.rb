# frozen_string_literal: true

module Student
  module Analytics
    class TaskStats
      def initialize(user, from: nil, to: nil)
        @user = user
        @from = from
        @to = to
      end

      def completed_count
        @completed_count ||= tasks_in_period.completed.count
      end

      def total_count
        @total_count ||= tasks_in_period.count
      end

      private

      def tasks_in_period
        # 期間を指定しない場合は累計(due_dateがnullのタスクも含む)
        return @user.tasks if @from.nil? && @to.nil?

        @user.tasks.where(due_date: @from..@to)
      end
    end
  end
end
