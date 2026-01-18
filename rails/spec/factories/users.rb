# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    password { 'password' }
    password_confirmation { 'password' }
    name { 'テスト太郎' }
    name_kana { 'テストタロウ' }

    association :user_role, factory: %i[user_role student]
    association :high_school

    trait :admin do
      user_role { association :user_role, :admin }
    end

    trait :teacher do
      user_role { association :user_role, :teacher }
    end

    trait :guardian do
      user_role { association :user_role, :guardian }
    end
  end
end
