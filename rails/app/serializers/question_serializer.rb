# frozen_string_literal: true

# == Schema Information
#
# Table name: questions
#
#  id             :bigint           not null, primary key
#  unit_id        :bigint           not null
#  question_text  :text(65535)      not null
#  correct_answer :text(65535)      not null
#  deleted_at     :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class QuestionSerializer < ActiveModel::Serializer
  attributes :id, :unit_id, :question_text, :course_id, :answered

  has_many :question_hints, each_serializer: QuestionHintSerializer
  has_many :question_choices, each_serializer: QuestionChoiceSerializer

  def course_id
    object.unit.course_id
  end

  def answered
    object.question_histories.any? { |qh| qh.user_id == scope.id }
  end
end
