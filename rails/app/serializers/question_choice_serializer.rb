# frozen_string_literal: true

class QuestionChoiceSerializer < ActiveModel::Serializer
  attributes :id, :question_id, :choice_number, :choice_text
end
