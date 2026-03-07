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
class DraftTaskCourse < ApplicationRecord
  belongs_to :draft_task
  belongs_to :course
end
