# frozen_string_literal: true

# == Schema Information
#
# Table name: teacher_school_classes
#
#  id              :bigint           not null, primary key
#  user_id         :bigint           not null
#  school_class_id :bigint           not null
#  role            :integer          not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
class TeacherSchoolClass < ApplicationRecord
  belongs_to :user
  belongs_to :school_class

  validates :user_id, uniqueness: { scope: :school_class_id }
  validate :user_must_be_teacher

  enum role: {
    homeroom: 0,
    assistant: 1
  }

  private

  def user_must_be_teacher
    errors.add(:user, :not_teacher) unless user&.teacher?
  end
end
