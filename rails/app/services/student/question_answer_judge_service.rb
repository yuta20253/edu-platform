# frozen_string_literal: true

module Student
  class QuestionAnswerJudgeService
    def initialize(question:, question_choice_id:)
      @question = question
      @question_choice_id = question_choice_id
    end

    def call
      prepare_context
      {
        selected_answer: @choice,
        correct_answer: @correct_answer,
        is_correct: @choice.to_s == @correct_answer
      }
    end

    private

    def prepare_context
      question_choice = @question.question_choices.find(@question_choice_id)
      @choice = question_choice.choice_number
      @correct_answer = @question.correct_answer
    end
  end
end
