# frozen_string_literal: true

FactoryBot.define do
  factory :goal do
    association :user
    sequence(:title) { |n| "テストタイトル#{n}" }
    sequence(:description) { |n| "テスト説明#{n}" }

    trait :not_started do
      status { :not_started }
    end

    trait :in_progress do
      status { :in_progress }
    end

    trait :completed do
      status { :completed }
    end
  end
end
