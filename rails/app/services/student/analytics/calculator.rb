# frozen_string_literal: true

module Student
  module Analytics
    class Calculator
      def self.completion_rate(completed_count, total_count)
        return 0 if total_count.zero?

        (completed_count.to_f / total_count * 100).round(1)
      end

      # メモ:
      # 引数には @user.question_histories のような Association と、
      # QuestionHistory.where(...) のような ActiveRecord::Relation の両方が渡される。
      # Association では Enumerable#count(&:is_correct) が使えるため共通メソッドとしている。
      def self.correct_rate(histories)
        total_count = histories.size
        return 0 if total_count.zero?

        correct_count = histories.count(&:is_correct)

        (correct_count.to_f / total_count * 100).round(1)
      end

      def self.correct_rate_from_counts(correct_count, total_count)
        return 0 if total_count.zero?

        (correct_count.to_f / total_count * 100).round(1)
      end
    end
  end
end
