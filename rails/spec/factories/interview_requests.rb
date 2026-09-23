# frozen_string_literal: true

# == Schema Information
#
# Table name: interview_requests
#
#  id              :bigint           not null, primary key
#  student_id      :bigint           not null
#  teacher_id      :bigint           not null
#  initiator_id    :bigint           not null
#  initiator_role  :integer          not null
#  status          :integer          default("requested"), not null
#  reason_category :integer
#  reason_detail   :text(65535)      not null
#  scheduled_at    :datetime
#  completed_at    :datetime
#  cancelled_at    :datetime
#  cancelled_by_id :bigint
#  cancel_reason   :text(65535)
#  lock_version    :integer          default(0), not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  active_pair_key :string(255)
#
FactoryBot.define do
  factory :interview_request do
    association :student, factory: %i[user student]
    association :teacher, factory: %i[user teacher]
    reason_detail { '学習状況について相談したい' }
    status { :requested }
    initiator_role { :teacher }
    initiator { teacher }
    reason_category { nil }

    trait :initiated_by_teacher do
      initiator_role { :teacher }
      initiator { teacher }
      reason_category { nil }
    end

    trait :initiated_by_student do
      initiator_role { :student }
      initiator { student }
      reason_category { :study_method }
    end
  end
end
