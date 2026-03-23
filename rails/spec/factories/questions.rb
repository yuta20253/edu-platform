# frozen_string_literal: true

# == Schema Information
#
# Table name: questions
#
#  id            :bigint           not null, primary key
#  unit_id       :bigint           not null
#  question_text :text(65535)      not null
#  correct_answer :text(65535)     not null
#  deleted_at    :datetime
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
FactoryBot.define do
  factory :question do
    association :unit
    sequence(:question_text) { |n| "問題文#{n}" }
    correct_answer { '1' }
  end
end
