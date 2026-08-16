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
  has_many :users, dependent: :restrict_with_error
  has_many :teacher_school_classes, dependent: :destroy
  has_many :teachers, through: :teacher_school_classes, source: :user
  has_many :school_class_requests, dependent: :nullify

  validates :name, presence: true, length: { maximum: 255 }
end
