# frozen_string_literal: true

# == Schema Information
#
# Table name: user_roles
#
#  id         :bigint           not null, primary key
#  name       :integer          default(1), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class UserRole < ApplicationRecord
  has_many :users

  enum name: {
    admin: 0,
    student: 1,
    teacher: 2,
    guardian: 3
  }
end
