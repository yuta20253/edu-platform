# frozen_string_literal: true

module Student
  module Analytics
    class TaskStats
      def self.call(user)
        new(user)
      end

      def initialize(user)
        @user = user
      end

      def completed_count
        @completed_count ||= @user.tasks.completed.count
      end

      def total_count
        @total_count ||= @user.tasks.count
      end
    end
  end
end
