# frozen_string_literal: true

module Admin
  class QuestionDetailSerializer < ActiveModel::Serializer
    attributes :id, :question_text, :correct_answer, :choices, :hints, :explanations

    def choices
      object.question_choices.sort_by { |c| c.choice_number || 0 }.map do |c|
        { id: c.id, choice_number: c.choice_number, choice_text: c.choice_text }
      end
    end

    def hints
      object.question_hints.sort_by { |h| h.step_number || 0 }.map do |h|
        { id: h.id, step_number: h.step_number, hint_text: h.hint_text }
      end
    end

    def explanations
      object.question_explanations.sort_by(&:id).map do |e|
        { id: e.id, explanation_type: e.explanation_type, explanation_text: e.explanation_text }
      end
    end
  end
end
