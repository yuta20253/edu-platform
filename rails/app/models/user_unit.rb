# == Schema Information
#
# Table name: user_units
#
#  id           :bigint           not null, primary key
#  user_id      :bigint           not null
#  unit_id      :bigint           not null
#  progress     :integer          default(0)
#  completed_at :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
class UserUnit < ApplicationRecord
  belongs_to :user
  belongs_to :unit

  validates :progress, inclusion: { in: 0..100 }
end
