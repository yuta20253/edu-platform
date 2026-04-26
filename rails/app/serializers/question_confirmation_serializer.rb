# frozen_string_literal: true

class QuestionConfirmationSerializer < ActiveModel::Serializer
  attributes :question_id, :question_text, :correct_answer, :selected_choice_number, :status

  def question_id
    object.id
  end

  delegate :question_text, to: :object

  def correct_answer
    return nil if history.blank?

    object.correct_answer
  end

  def selected_choice_number
    history&.question_choice&.choice_number
  end

  def status
    history.present? ? 'answered' : 'unanswered'
  end

  private

  def history
    @history ||= question_histories_by_question_id[object.id]
  end

  def question_histories_by_question_id
    instance_options[:question_histories_by_question_id] || {}
  end
end
