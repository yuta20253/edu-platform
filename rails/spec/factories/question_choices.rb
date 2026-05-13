# frozen_string_literal: true

# == Schema Information
#
# Table name: question_choices
#
#  id            :bigint           not null, primary key
#  question_id   :bigint           not null
#  choice_number :integer
#  choice_text   :text(65535)
#  deleted_at    :datetime
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
FactoryBot.define do
  factory :question_choice do
    association :question
    choice_number { 1 }
    choice_text { '選択肢1' }
  end
end
