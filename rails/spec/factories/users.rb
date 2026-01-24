# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  email                  :string(255)      not null
#  encrypted_password     :string(255)      not null
#  reset_password_token   :string(255)
#  reset_password_sent_at :datetime
#  remember_created_at    :datetime
#  name                   :string(100)
#  name_kana              :string(100)
#  user_role_id           :bigint
#  jti                    :string(255)      not null
#  deleted_at             :datetime
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  high_school_id         :bigint
#  address_id             :bigint
#
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
