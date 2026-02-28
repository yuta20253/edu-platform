# == Schema Information
#
# Table name: teacher_grades
#
#  id         :bigint           not null, primary key
#  user_id    :bigint           not null
#  grade_id   :bigint           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
FactoryBot.define do
  factory :teacher_grade do
    user { nil }
    grade { nil }
  end
end
