# frozen_string_literal: true

# == Schema Information
#
# Table name: school_class_requests
#
#  id              :bigint           not null, primary key
#  school_class_id :bigint
#  applicant_id    :bigint           not null
#  approver_id     :bigint
#  grade_id        :bigint           not null
#  action          :integer          not null
#  status          :integer          default(0), not null
#  name            :string(255)
#  approved_at     :datetime
#  cancelled_at    :datetime
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
FactoryBot.define do
  factory :school_class_request do
    school_class { nil }
    applicant { nil }
    approver { nil }
    grade { nil }
    action { 1 }
    status { 1 }
    name { 'MyString' }
    approved_at { '2026-08-11 05:45:07' }
    cancelled_at { '2026-08-11 05:45:07' }
  end
end
