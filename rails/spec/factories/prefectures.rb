# frozen_string_literal: true

# == Schema Information
#
# Table name: prefectures
#
#  id         :bigint           not null, primary key
#  name       :string(255)      not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
FactoryBot.define do
  factory :prefecture do
    sequence(:name) { |n| "都道府県#{n}" }
  end

  trait :tokyo do
    name { '東京都' }
  end
end
