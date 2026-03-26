# frozen_string_literal: true

# == Schema Information
#
# Table name: high_schools
#
#  id            :bigint           not null, primary key
#  name          :string(50)       not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  prefecture_id :bigint           not null
#
FactoryBot.define do
  factory :high_school do
    sequence(:name) { |n| "テスト高校#{n}" }
    association :prefecture
  end
end
