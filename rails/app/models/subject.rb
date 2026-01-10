# == Schema Information
#
# Table name: subjects
#
#  id         :bigint           not null, primary key
#  name       :string(255)      not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Subject < ApplicationRecord
  has_many :courses
  has_many :user_subject_question_stats
  has_many :users, through: :user_subject_question_stats
end
