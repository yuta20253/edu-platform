# frozen_string_literal: true

# == Schema Information
#
# Table name: announcement_targets
#
#  id              :bigint           not null, primary key
#  announcement_id :bigint           not null
#  user_role_id    :bigint
#  grade_id        :bigint
#  high_school_id  :bigint
#  user_id         :bigint
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
FactoryBot.define do
  factory :announcement_target do
    association :announcement
    target_type { :all_users }

    trait :by_role do
      target_type { :by_role }
      user_role_id { 1 }
    end

    trait :by_school do
      target_type { :by_school }
      high_school_id { 1 }
    end

    trait :by_grade do
      target_type { :by_grade }
      grade_id { 1 }
    end
  end
end
