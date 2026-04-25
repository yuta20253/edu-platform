# frozen_string_literal: true

class QuestionHintSerializer < ActiveModel::Serializer
  attributes :id, :question_id, :step_number, :hint_text
end
