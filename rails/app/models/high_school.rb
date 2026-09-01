# frozen_string_literal: true

# == Schema Information
#
# Table name: high_schools
#
#  id            :bigint           not null, primary key
#  name          :string(50)       not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  prefecture_id :bigint           not null
#  school_code   :string
#  csv_managed   :boolean          default(FALSE), not null
#
class HighSchool < ApplicationRecord
  before_create :generate_school_code

  belongs_to :prefecture
  has_many :users
  has_many :grades

  scope :by_prefecture, ->(prefecture_id) { prefecture_id.present? ? where(prefecture_id: prefecture_id) : all }

  validates :name, presence: true
  validates :school_code, uniqueness: true, allow_nil: true

  def self.generate_unique_school_code
    loop do
      code = SecureRandom.alphanumeric(6).upcase
      break code unless HighSchool.exists?(school_code: code)
    end
  end

  private

  def generate_school_code
    self.school_code ||= self.class.generate_unique_school_code
  end
end
