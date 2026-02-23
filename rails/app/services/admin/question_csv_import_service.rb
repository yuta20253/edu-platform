# frozen_string_literal: true

module Admin
  class QuestionCsvImportService
    def initialize(form, unit_id)
      @form = form
      @unit_id = unit_id
    end

    def call
      question = Question.find_or_create_by!(
        unit_id: @unit_id,
        question_text: @form.question_text,
        correct_answer: @form.correct_answer
      )

      QuestionExplanation.find_or_create_by!(
        question_id: question.id,
        explanation_type: '基本解説',
        explanation_text: @form.explanation_text
      )

      @form.choices.each_with_index do |choice_text, index|
        QuestionChoice.find_or_create_by!(
          question_id: question.id,
          choice_number: index + 1,
          choice_text: choice_text
        )
      end

      @form.hints.each_with_index do |hint_text, index|
        QuestionHint.find_or_create_by!(
          question_id: question.id,
          step_number: index + 1,
          hint_text: hint_text
        )
      end
    end
  end
end
