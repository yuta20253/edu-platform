# frozen_string_literal: true

# == Schema Information
#
# Table name: question_explanations
#
#  id               :bigint           not null, primary key
#  question_id      :bigint           not null
#  explanation_type :string(255)
#  explanation_text :text(65535)
#  deleted_at       :datetime
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
FactoryBot.define do
  factory :question_explanation do
    association :question
    explanation_type { QuestionExplanation::BASIC }
    explanation_text { '解説文' }
  end
end
