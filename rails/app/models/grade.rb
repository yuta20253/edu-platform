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

  DISPLAY_NAMES = [
    "中３生",   # 0
    "高１生",   # 1
    "高２生",   # 2
    "高３生",   # 3
    "高卒生",   # 4
    "新高１生", # 5
    "新高２生", # 6
    "新高３生"  # 7
  ].freeze

  def display_name
    DISPLAY_NAMES[year] || '不明'
  end
end
