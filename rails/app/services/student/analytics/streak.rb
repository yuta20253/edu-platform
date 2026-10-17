# frozen_string_literal: true

module Student
  module Analytics
    class Streak
      def initialize(user)
        @user = user
      end

      def call
        dates = studied_dates
        start_date = streak_start_date(dates)

        return 0 if start_date.nil?

        count_consecutive_days(dates, start_date)
      end

      private

      def studied_dates
        @user
          .study_logs
          .active
          .pluck(:started_at)
          .to_set(&:to_date)
      end

      def streak_start_date(dates)
        if dates.include?(Date.current)
          Date.current
        elsif dates.include?(Date.current - 1)
          Date.current - 1
        end
      end

      def count_consecutive_days(dates, start_date)
        streak_days = 0
        date = start_date
        while dates.include?(date)
          streak_days += 1
          date -= 1
        end
        streak_days
      end
    end
  end
end
