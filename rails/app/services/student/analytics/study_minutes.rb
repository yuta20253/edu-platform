# frozen_string_literal: true

module Student
  module Analytics
    class StudyMinutes
      DAILY_MAX_DAYS = 31
      WEEK_DAYS = 7

      def initialize(user, from:, to:)
        @user = user
        @from = from
        @to = to
      end

      def call
        {
          unit: unit,
          series: series,
          total: minutes_by_date.values.sum
        }
      end

      private

      def minutes_by_date
        @minutes_by_date ||=
          study_logs
          .pluck(:started_at, :duration_minutes)
          .group_by { |started_at, _minutes| started_at.to_date }
          .transform_values { |pairs| pairs.sum { |_started_at, minutes| minutes.to_i } }
      end

      def study_logs
        @user
          .study_logs
          .active
          .where(started_at: jst_range(@from, @to))
      end

      def period_days
        (@to - @from + 1).to_i
      end

      def unit
        period_days <= DAILY_MAX_DAYS ? 'day' : 'week'
      end

      def daily_series
        dates = (@from..@to)
        dates.map do |date|
          { date: date, minutes: minutes_by_date.fetch(date, 0) }
        end
      end

      def weekly_series
        daily_series
          .each_slice(WEEK_DAYS)
          .map do |week|
            { date: week.first[:date], minutes: week.sum { |day| day[:minutes] } }
          end
      end

      def series
        unit == 'day' ? daily_series : weekly_series
      end

      def jst_range(from_date, to_date)
        from_date.in_time_zone.beginning_of_day..to_date.in_time_zone.end_of_day
      end
    end
  end
end
