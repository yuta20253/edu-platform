# == Schema Information
#
# Table name: task_courses
#
#  id         :bigint           not null, primary key
#  task_id    :bigint           not null
#  course_id  :bigint           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class TaskCourse < ApplicationRecord
  belongs_to :task
  belongs_to :course
end
