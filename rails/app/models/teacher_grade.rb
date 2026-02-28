class TeacherGrade < ApplicationRecord
  belongs_to :user
  belongs_to :grade

  validates :user_id, uniquness: { scope: grade_id }
end
