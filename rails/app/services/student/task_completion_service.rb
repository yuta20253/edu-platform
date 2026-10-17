# frozen_string_literal: true

module Student
  class TaskCompletionService
    def initialize(user:, task_id:)
      @user = user
      @task_id = task_id
    end

    def call
      return :completed if task.completed?

      return :completed if all_answered?
      return :in_progress if answered_count.positive?

      :not_started
    end

    private

    def task
      @task ||= @user.tasks.find(@task_id)
    end

    # 教員画面の進捗率(Common::TaskProgressService)と判定がずれないよう、同じ集計Queryを使う
    def task_answer_stats_query
      @task_answer_stats_query ||= TaskAnswerStatsQuery.new(user: @user, task_ids: [task.id])
    end

    def all_answered?
      answered_count == total_questions_count
    end

    def total_questions_count
      @total_questions_count ||= task_answer_stats_query.question_counts.values.sum
    end

    def answered_count
      @answered_count ||= task_answer_stats_query.answer_counts.values.sum { |counts| counts[:answered_count] }
    end
  end
end
