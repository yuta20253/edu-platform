# == Schema Information
#
# Table name: teacher_grades
#
#  id         :bigint           not null, primary key
#  user_id    :bigint           not null
#  grade_id   :bigint           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class TeacherGrade < ApplicationRecord
  belongs_to :user
  belongs_to :grade

  validates :user_id, uniqueness: { scope: :grade_id }
  validate :user_must_be_teacher

  private

  def user_must_be_teacher
    errors.add(:user, :not_teacher) unless user&.teacher?
  end
end
