class TeacherPermission < ApplicationRecord
  belongs_to :user

  enum grade_scope: {
    own_grade: 0,
    all_grades: 1
  }
end
