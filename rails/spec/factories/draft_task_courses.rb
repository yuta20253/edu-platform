# frozen_string_literal: true

# == Schema Information
#
# Table name: draft_task_courses
#
#  id            :bigint           not null, primary key
#  draft_task_id :bigint           not null
#  course_id     :bigint           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
FactoryBot.define do
  factory :draft_task_course do
    draft_task { nil }
    course { nil }
  end
end
