# frozen_string_literal: true

# == Schema Information
#
# Table name: units
#
#  id         :bigint           not null, primary key
#  course_id  :bigint           not null
#  unit_name  :string(255)      not null
#  deleted_at :datetime
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
FactoryBot.define do
  factory :unit do
    association :course
    sequence(:unit_name) { |n| "単元#{n}" }
  end
end
