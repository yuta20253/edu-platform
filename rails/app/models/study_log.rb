# == Schema Information
#
# Table name: study_logs
#
#  id               :bigint           not null, primary key
#  user_id          :bigint           not null
#  task_id          :bigint           not null
#  started_at       :datetime         not null
#  ended_at         :datetime
#  duration_minutes :integer
#  deleted_at       :datetime
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
class StudyLog < ApplicationRecord
  belongs_to :user
  belongs_to :task
end
