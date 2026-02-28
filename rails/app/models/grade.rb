class Grade < ApplicationRecord
  belongs_to :high_school
  has_many :teacher_grades
  has_many :users, through: :teacher_grades

  validates :year, presence: true
  validates :year, uniquness: { scope: high_school_id }
end
