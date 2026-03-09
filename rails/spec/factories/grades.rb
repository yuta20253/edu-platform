# frozen_string_literal: true

# == Schema Information
#
# Table name: grades
#
#  id             :bigint           not null, primary key
#  high_school_id :bigint           not null
#  year           :integer          not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
FactoryBot.define do
  factory :grade do
    association :high_school
    sequence(:year) { |n| n }
  end
end
