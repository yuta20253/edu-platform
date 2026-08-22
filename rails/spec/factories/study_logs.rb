# frozen_string_literal: true

FactoryBot.define do
  factory :study_log do
    association :user
    association :task
    association :unit
    status { :studying }
    started_at { Time.current }
  end
end
