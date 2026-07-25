# frozen_string_literal: true

# == Schema Information
#
# Table name: school_classes
#
#  id         :bigint           not null, primary key
#  grade_id   :bigint           not null
#  name       :string(255)      not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class SchoolClass < ApplicationRecord
  belongs_to :grade
  has_many :users

  validate :school_class_belongs_to_grade

  private

  def school_class_belongs_to_grade
    return unless school_class && grade

    errors.add(:school_class, '学年が一致しません') unless school_class.grade_id == grade_id
  end
end
