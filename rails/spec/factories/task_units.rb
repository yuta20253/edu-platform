# frozen_string_literal: true

# == Schema Information
#
# Table name: task_units
#
#  id         :bigint           not null, primary key
#  task_id    :bigint           not null
#  unit_id    :bigint           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
FactoryBot.define do
  factory :task_unit do
    task { nil }
    unit { nil }
  end
end
