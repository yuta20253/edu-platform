# frozen_string_literal: true

# == Schema Information
#
# Table name: courses
#
#  id           :bigint           not null, primary key
#  subject_id   :bigint
#  level_number :integer          default(1), not null
#  level_name   :string(255)      not null
#  description  :text(65535)
#  deleted_at   :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
class Course < ApplicationRecord
  belongs_to :subject
  has_one :review_test, dependent: :destroy
  has_many :reflections, dependent: :destroy
  has_many :units, dependent: :destroy
  has_many :question_histories, dependent: :destroy
  has_many :task_courses, dependent: :destroy
  has_many :tasks, through: :task_courses
  has_many :user_unit_question_stats, dependent: :destroy
end
