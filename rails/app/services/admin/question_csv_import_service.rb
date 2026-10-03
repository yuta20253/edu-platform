# frozen_string_literal: true

module Admin
  class QuestionCsvImportService
    def initialize(form, unit_id)
      @form = form
      @unit_id = unit_id
    end

    def call
      question = Question.active.find_or_create_by!(
        unit_id: @unit_id,
        question_text: @form.question_text,
        correct_answer: @form.correct_answer
      )

      # (question_id, explanation_type) は UNIQUE(deleted_at 非対象)。論理削除済みの
      # 同キー行があると .active では拾えずINSERTが衝突するため、UNIQUEキーで
      # 引き当てて内容更新＆復活させる(default_scopeを外すためunscoped)。
      explanation = QuestionExplanation.unscoped.find_or_initialize_by(
        question_id: question.id,
        explanation_type: QuestionExplanation::BASIC
      )
      explanation.update!(explanation_text: @form.explanation_text, deleted_at: nil)

      @form.choices.each_with_index do |choice_text, index|
        # (question_id, choice_number) は UNIQUE(deleted_at 非対象)。論理削除済みの
        # 同キー行があると .active では拾えずINSERTが衝突するため、UNIQUEキーで
        # 引き当てて内容更新＆復活させる(default_scopeを外すためunscoped)。
        choice = QuestionChoice.unscoped.find_or_initialize_by(
          question_id: question.id,
          choice_number: index + 1
        )
        choice.update!(choice_text: choice_text, deleted_at: nil)
      end

      @form.hints.each_with_index do |hint_text, index|
        # (question_id, step_number) は UNIQUE(deleted_at 非対象)。論理削除済みの
        # 同キー行があると .active では拾えずINSERTが衝突するため、UNIQUEキーで
        # 引き当てて内容更新＆復活させる(default_scopeを外すためunscoped)。
        hint = QuestionHint.unscoped.find_or_initialize_by(
          question_id: question.id,
          step_number: index + 1
        )
        hint.update!(hint_text: hint_text, deleted_at: nil)
      end
    end
  end
end
