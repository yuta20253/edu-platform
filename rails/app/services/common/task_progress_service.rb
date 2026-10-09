class Common::TaskProgressService
  def initialize(user:, tasks:)
    @user = user
    @tasks = tasks
  end

  def call
    answer_counts = task_answer_stats_query.answer_counts
    question_counts = task_answer_stats_query.question_counts

    @tasks.to_h do |task|
      units = task.units.to_h do |unit|
        counts = answer_counts.fetch([task.id, unit.id], {})
        total_questions = question_counts.fetch(unit.id, 0)
        answered_count = counts.fetch(:answered_count, 0)
        correct_count = counts.fetch(:correct_count, 0)
        [unit.id, {
          total_questions: total_questions,
          answered_count: answered_count,
          correct_count: correct_count,
          progress_rate: progress_rate(answered_count, total_questions),
          correct_rate: correct_rate(correct_count, answered_count)
        }]
      end

      total_questions = units.values.sum { |stats| stats[:total_questions] }
      answered_count = units.values.sum { |stats| stats[:answered_count] }
      correct_count = units.values.sum { |stats| stats[:correct_count] }
      progress_rate = progress_rate(answered_count, total_questions)
      correct_rate = correct_rate(correct_count, answered_count)

      [task.id, {
        total_questions: total_questions,
        answered_count: answered_count,
        correct_count: correct_count,
        progress_rate: progress_rate,
        correct_rate: correct_rate,
        units: units
      }]
    end
  end

  private

  def task_answer_stats_query
    @task_answer_stats_query ||= TaskAnswerStatsQuery.new(user: @user, task_ids: task_ids)
  end

  def task_ids
    @tasks.map(&:id)
  end

  def progress_rate(answered_count, total_questions_count)
    ::Student::Analytics::Calculator.completion_rate(answered_count, total_questions_count)
  end

  def correct_rate(correct_count, total_count)
    return nil if total_count.zero?
    ::Student::Analytics::Calculator.correct_rate_from_counts(correct_count, total_count)
  end
end
