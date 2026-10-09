class TaskAnswerStatsQuery
  def initialize(user:, task_ids:)
    @user = user
    @task_ids = task_ids
  end

  def answer_counts
    question_histories
      .group(:task_id, :unit_id)
      .pluck(:task_id, :unit_id, Arel.sql('COUNT(*)'), Arel.sql(QuestionHistory::CORRECT_ANSWER_COUNT))
      .to_h do |task_id, unit_id, answered_count, correct_count|
        [[task_id, unit_id], { answered_count: answered_count, correct_count: correct_count.to_i }]
      end
  end

  def question_counts
    task_unit_ids_scope = TaskUnit.where(task_id: @task_ids).select(:unit_id)
    Question.where(unit_id: task_unit_ids_scope).group(:unit_id).count
  end

  private

  def question_histories
    QuestionHistory.on_active_questions.where(user: @user, task_id: @task_ids)
  end
end
