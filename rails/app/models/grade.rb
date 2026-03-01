# == Schema Information
#
# Table name: grades
#
#  id             :bigint           not null, primary key
#  high_school_id :bigint           not null
#  year           :integer          not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class Grade < ApplicationRecord
  belongs_to :high_school
  has_many :teacher_grades, dependent: :destroy
  has_many :users, through: :teacher_grades, source: :user

  validates :year, presence: true
  validates :year, uniqueness: { scope: :high_school_id }
end
