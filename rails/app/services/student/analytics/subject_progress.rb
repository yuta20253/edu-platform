# frozen_string_literal: true

module Student
  module Analytics
    class SubjectProgress
      include AnalyticsPeriodable

      def initialize(user, from:, to:)
        @user = user
        @from = from
        @to = to
      end

      def call
        question_histories
          .joins(course: :subject)
          .group('subjects.id', 'subjects.name')
          .order('subjects.id')
          .pluck(
            'subjects.name',
            Arel.sql('COUNT(*)'),
            Arel.sql(QuestionHistory::CORRECT_ANSWER_COUNT)
          )
          .map do |subject_name, total_count, correct_count|
            {
              subject_name: subject_name,
              correct_rate: Student::Analytics::Calculator.correct_rate_from_counts(correct_count, total_count)
            }
          end
      end

      private

      def question_histories
        @user
          .question_histories
          .active
          .where(answered_at: jst_range)
      end
    end
  end
end
