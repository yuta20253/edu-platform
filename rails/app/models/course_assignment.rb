# frozen_string_literal: true

# == Schema Information
#
# Table name: course_assignments
#
#  id             :bigint           not null, primary key
#  high_school_id :bigint           not null
#  course_id      :bigint           not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class CourseAssignment < ApplicationRecord
  belongs_to :high_school
  belongs_to :course

  validates :course_id, uniqueness: { scope: :high_school_id }
end
