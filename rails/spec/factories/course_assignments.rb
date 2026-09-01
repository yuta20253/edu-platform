# frozen_string_literal: true

FactoryBot.define do
  factory :course_assignment do
    association :high_school
    association :course
  end
end
