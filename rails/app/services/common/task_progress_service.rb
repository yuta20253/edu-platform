# frozen_string_literal: true

module Common
  # タスクごと・タスク×Unitごとの解答状況(件数と進捗率・正答率)を組み立てる。
  # 集計はTaskAnswerStatsQueryの2クエリだけで行い、tasksはunitsを読み込み済みで渡す。
  class TaskProgressService
    def initialize(user:, tasks:)
      @user = user
      @tasks = tasks
    end

    def call
      @tasks.to_h do |task|
        units = task.units.to_h { |unit| [unit.id, unit_stats(task, unit)] }

        [task.id, task_stats(units).merge(units: units)]
      end
    end

    private

    def unit_stats(task, unit)
      counts = answer_counts.fetch([task.id, unit.id], {})

      build_stats(
        total_questions: question_counts.fetch(unit.id, 0),
        answered_count: counts.fetch(:answered_count, 0),
        correct_count: counts.fetch(:correct_count, 0)
      )
    end

    # タスク単位の値は、Unitごとの率の平均ではなく、件数を合計してから率を出す
    def task_stats(units)
      unit_stats_list = units.values

      build_stats(
        total_questions: unit_stats_list.sum { |stats| stats[:total_questions] },
        answered_count: unit_stats_list.sum { |stats| stats[:answered_count] },
        correct_count: unit_stats_list.sum { |stats| stats[:correct_count] }
      )
    end

    def build_stats(total_questions:, answered_count:, correct_count:)
      {
        total_questions:,
        answered_count:,
        correct_count:,
        progress_rate: ::Student::Analytics::Calculator.completion_rate(answered_count, total_questions),
        correct_rate: correct_rate(correct_count, answered_count)
      }
    end

    # Calculatorは分母0のとき0を返すが、未解答は「正答率なし」としてnilにする
    def correct_rate(correct_count, answered_count)
      return nil if answered_count.zero?

      ::Student::Analytics::Calculator.correct_rate_from_counts(correct_count, answered_count)
    end

    def answer_counts
      @answer_counts ||= task_answer_stats_query.answer_counts
    end

    def question_counts
      @question_counts ||= task_answer_stats_query.question_counts
    end

    def task_answer_stats_query
      @task_answer_stats_query ||= TaskAnswerStatsQuery.new(user: @user, task_ids: @tasks.map(&:id))
    end
  end
end
