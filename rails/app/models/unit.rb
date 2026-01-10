# == Schema Information
#
# Table name: units
#
#  id         :bigint           not null, primary key
#  course_id  :bigint           not null
#  unit_name  :string(255)      not null
#  deleted_at :datetime
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Unit < ApplicationRecord
  belongs_to :course
  has_many :questions, dependent: :destroy
  has_many :question_histories
  has_many :user_unit_question_stats, dependent: :destroy
end
