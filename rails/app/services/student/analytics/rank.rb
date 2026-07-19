# frozen_string_literal: true

module Student
  module Analytics
    class Rank
      def self.call(user, column_name, id)
        new(user, column_name, id).call
      end

      def initialize(user, column_name, id)
        @user = user
        @column_name = column_name
        @id = id
      end

      def call
        build_rank
      end

      private

      def build_rank
        histories = QuestionHistory
                    .where(@column_name => @id)
                    .group(:user_id)
                    .select(
                      :user_id,
                      'COUNT(*) AS total_count',
                      'SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count'
                    )

        rankings = histories.map do |history|
          {
            user_id: history.user_id,
            correct_rate: Calculator.correct_rate_from_counts(history.correct_count, history.total_count)
          }
        end

        rankings.sort_by! { |ranking| -ranking[:correct_rate] }

        my_rank = rankings.index { |ranking| ranking[:user_id] == @user.id }

        {
          rank: my_rank ? my_rank + 1 : nil,
          total_users: rankings.size
        }
      end
    end
  end
end
