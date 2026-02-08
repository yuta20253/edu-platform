# frozen_string_literal: true

# == Schema Information
#
# Table name: goals
#
#  id          :bigint           not null, primary key
#  user_id     :bigint           not null
#  title       :string(255)      not null
#  description :text(65535)
#  due_date    :date
#  status      :integer          default("not_started"), not null
#  deleted_at  :datetime
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
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
