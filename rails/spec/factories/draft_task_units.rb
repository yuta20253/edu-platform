# frozen_string_literal: true

# == Schema Information
#
# Table name: draft_task_units
#
#  id            :bigint           not null, primary key
#  draft_task_id :bigint           not null
#  unit_id       :bigint           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
FactoryBot.define do
  factory :draft_task_unit do
    draft_task { nil }
    unit { nil }
  end
end
