# frozen_string_literal: true

module Admin
  class QuestionImportForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :question_text, :string
    attribute :correct_answer, :integer

    attribute :explanation_text, :string

    attribute :choices, array: true, default: []
    attribute :hints, array: true, default: []

    validates :question_text, presence: true
    validates :correct_answer, presence: true, inclusion: { in: 1..4 }
    validates :explanation_text, presence: true
    validates :choices, presence: true, length: { is: 4 }
    validates :hints, length: { maximum: 2 }
  end
end
