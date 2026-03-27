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
#
class HighSchool < ApplicationRecord
  belongs_to :prefecture
  has_many :users
  has_many :grades

  scope :by_prefecture, ->(prefecture_id) { prefecture_id.present? ? where(prefecture_id: prefecture_id) : all }

  validates :name, presence: true
end
