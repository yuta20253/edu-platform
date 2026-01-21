# frozen_string_literal: true

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
  has_many :user_units, dependent: :destroy
  has_many :users, through: :user_units
  has_many :task_units, dependent: :destroy
  has_many :tasks, through: :task_units
end
