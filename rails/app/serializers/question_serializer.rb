# frozen_string_literal: true

class QuestionSerializer < ActiveModel::Serializer
  attributes :id, :unit_id, :question_text, :correct_answer, :course_id

  has_many :question_hints, each_serializer: QuestionHintSerializer
  has_many :question_choices, each_serializer: QuestionChoiceSerializer

  def course_id
    object.unit.course_id
  end
end
