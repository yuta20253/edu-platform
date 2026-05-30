# frozen_string_literal: true

module Admin
  class QuestionExplanationSerializer < ActiveModel::Serializer
    attributes :id, :explanation_type, :explanation_text
  end
end
