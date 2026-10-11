# frozen_string_literal: true

module Student
  module Analytics
    class Summary
      def initialize(user, from:, to:)
        @user = user
        @from = from
        @to = to
      end

      def call
        {
          streak_days: streak_days,
          task_completion: task_completion,
          study_minutes: study_minutes,
          subject_progress: subject_progress,
          meta: meta
        }
      end

      private

      def streak_days
        Streak.new(@user).call
      end

      def task_completion
        {
          current: TaskCompletion.new(@user, from: @from, to: @to).call,
          previous: TaskCompletion.new(@user, from: previous_from, to: previous_to).call
        }
      end

      def study_minutes
        current = StudyMinutes.new(@user, from: @from, to: @to).call
        previous = StudyMinutes.new(@user, from: previous_from, to: previous_to).call
        {
          unit: current[:unit],
          series: current[:series],
          total:
            { current: current[:total],
              previous: previous[:total] }
        }
      end

      def subject_progress
        current = SubjectProgress
                  .new(@user, from: @from, to: @to)
                  .call

        previous_rates = SubjectProgress
                         .new(@user, from: previous_from, to: previous_to)
                         .call
                         .to_h { |item| [item[:subject_name], item[:correct_rate]] }

        current.map do |item|
          { subject_name: item[:subject_name],
            correct_rate: { current: item[:correct_rate], previous: previous_rates[item[:subject_name]] } }
        end
      end

      def previous_from
        @from - period_days
      end

      def previous_to
        @from - 1
      end

      def period_days
        (@to - @from + 1).to_i
      end

      def meta
        {
          previous_from: previous_from,
          previous_to: previous_to,
          from: @from,
          to: @to
        }
      end
    end
  end
end
