# == Schema Information
#
# Table name: user_units
#
#  id           :bigint           not null, primary key
#  user_id      :bigint           not null
#  unit_id      :bigint           not null
#  progress     :integer          default(0)
#  completed_at :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
FactoryBot.define do
  factory :user_unit do
    user { nil }
    unit { nil }
    progress { 1 }
    completed_at { "2026-01-21 15:02:57" }
  end
end
