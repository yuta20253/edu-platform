# == Schema Information
#
# Table name: tasks
#
#  id             :bigint           not null, primary key
#  user_id        :bigint           not null
#  goal_id        :bigint
#  title          :string(100)      not null
#  content        :text(65535)      not null
#  priority       :integer          default(3), not null
#  due_date       :date
#  estimated_time :integer
#  status         :integer          default(0), not null
#  memo           :text(65535)
#  completed_at   :datetime
#  deleted_at     :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class Task < ApplicationRecord
  belongs_to :user
  belongs_to :goal
  has_many :task_courses, dependent: :destroy
  has_many :courses, through: :task_courses
end
