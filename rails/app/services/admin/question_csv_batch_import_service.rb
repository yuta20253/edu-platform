# frozen_string_literal: true

module Admin
  class QuestionCsvBatchImportService
    def initialize(import_history)
      @import_history = import_history
      @unit_id = import_history.unit_id
    end

    def call
      Csv::BatchImportService.new(
        @import_history,
        form_class: Admin::QuestionImportForm,
        before_rows: @import_history.overwrite? ? method(:overwrite_existing_questions!) : nil,
        row_importer: ->(form) { Admin::QuestionCsvImportService.new(form, @unit_id).call }
      ).call
    end

    private

    # overwriteモード: 単元内の既存問題と子レコードを論理削除する。
    # 回答履歴(question_histories)は保持し、FK制約を壊さない。
    def overwrite_existing_questions!
      now = Time.current
      question_scope = Question.active.where(unit_id: @unit_id)
      child_scope = { question_id: question_scope.select(:id) }

      QuestionChoice.active.where(child_scope).update_all(deleted_at: now, updated_at: now)
      QuestionHint.active.where(child_scope).update_all(deleted_at: now, updated_at: now)
      QuestionExplanation.active.where(child_scope).update_all(deleted_at: now, updated_at: now)
      question_scope.update_all(deleted_at: now, updated_at: now)
    end
  end
end
