# frozen_string_literal: true

FactoryBot.define do
  factory :high_school do
    sequence(:name) { |n| "テスト高校#{n}" }
  end
end
