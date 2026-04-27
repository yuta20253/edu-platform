# frozen_string_literal: true

module Student
  class TaskCompletionService
    def initialize(user:, task_id:)
      @user = user
      @task_id = task_id
    end

    def call
      return :not_started unless task
      return :completed if all_answered?
      return :in_progress if answered_count.positive?

      :not_started
    end

    private

    def task
      return @task if defined?(@task)

      @task = @user.tasks.find_by(id: @task_id)
    end

    def question_histories
      @question_histories ||= @user.question_histories.where(task_id: @task_id)
    end

    def unit_ids
      @unit_ids ||= task.units.pluck(:id)
    end

    def all_answered?
      answered_count == total_questions_count
    end

    def total_questions_count
      @total_questions_count ||= Question.where(unit_id: unit_ids).count
    end

    def answered_count
      @answered_count ||= question_histories.select(:question_id).distinct.count
    end
  end
end
