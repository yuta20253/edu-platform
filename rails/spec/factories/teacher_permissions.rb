# == Schema Information
#
# Table name: teacher_permissions
#
#  id                    :bigint           not null, primary key
#  user_id               :bigint           not null
#  grade_scope           :integer
#  manage_other_teachers :boolean
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#
FactoryBot.define do
  factory :teacher_permission do
    user { nil }
    grade_scope { 1 }
    manage_other_teachers { false }
  end
end
