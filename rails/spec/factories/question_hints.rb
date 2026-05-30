# frozen_string_literal: true

# == Schema Information
#
# Table name: question_hints
#
#  id          :bigint           not null, primary key
#  question_id :bigint           not null
#  step_number :integer
#  hint_text   :text(65535)
#  deleted_at  :datetime
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
FactoryBot.define do
  factory :question_hint do
    association :question
    step_number { 1 }
    hint_text { 'ヒント1' }
  end
end
