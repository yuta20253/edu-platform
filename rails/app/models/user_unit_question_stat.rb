# == Schema Information
#
# Table name: user_unit_question_stats
#
#  id                :bigint           not null, primary key
#  user_id           :bigint           not null
#  course_id         :bigint           not null
#  unit_id           :bigint           not null
#  total_questions   :integer
#  correct_questions :integer
#  total_time_sec    :integer
#  accuracy_rate     :decimal(10, )
#  avg_time_sec      :decimal(10, )
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
class UserUnitQuestionStat < ApplicationRecord
  belongs_to :user
  belongs_to :course
  belongs_to :unit
end
