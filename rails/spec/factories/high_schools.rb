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
    prefecture { Prefecture.find_or_create_by(name: '東京都') }
  end
end
