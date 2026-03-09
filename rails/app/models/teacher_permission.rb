# frozen_string_literal: true

# == Schema Information
#
# Table name: teacher_permissions
#
#  id                    :bigint           not null, primary key
#  user_id               :bigint           not null
#  grade_scope           :integer
#  manage_other_teachers :boolean
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#
class TeacherPermission < ApplicationRecord
  belongs_to :user

  validates :user_id, uniqueness: true
  validate :user_must_be_teacher

  enum grade_scope: {
    own_grade: 0,
    all_grades: 1
  }

  private

  def user_must_be_teacher
    errors.add(:user, :not_teacher) unless user&.teacher?
  end
end
