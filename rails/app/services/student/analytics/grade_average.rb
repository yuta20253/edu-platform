# frozen_string_literal: true

module Student
  module Analytics
    class GradeAverage
      def self.call(user)
        new(user).call
      end

      def initialize(user)
        @user = user
      end

      def call
        build_grade_average
      end

      private

      def build_grade_average
        task_stats = TaskStats.call(@user)

        completed_count = task_stats.completed_count
        total_count = task_stats.total_count
        {
          correct_rate: {
            my: Calculator.correct_rate(@user.question_histories),
            average: average_correct_rate
          },
          task_completion_rate: {
            my: Calculator.completion_rate(completed_count, total_count),
            average: average_task_completion_rate
          }
        }
      end

      # メモ:
      # 学年全体の集計は DB 上で集計した方が効率的。
      # 集計済みの正答数・総問題数から正答率を算出する。
      def average_correct_rate
        return 0 if grade_users.empty?

        histories = QuestionHistory.where(user_id: grade_users.select(:id))

        total_count = histories.count
        return 0 if total_count.zero?

        correct_count = histories.where(is_correct: true).count

        Calculator.correct_rate_from_counts(
          correct_count,
          total_count
        )
      end

      def average_task_completion_rate
        return 0 if grade_users.empty?

        tasks = Task.where(user_id: grade_users.select(:id))

        Calculator.completion_rate(tasks.completed.count, tasks.count)
      end

      def grade_users
        @grade_users ||= User.joins(:grade).where(grades: { year: @user.grade.year })
      end
    end
  end
end
