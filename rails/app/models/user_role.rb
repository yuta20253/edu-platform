# frozen_string_literal: true

# == Schema Information
#
# Table name: user_roles
#
#  id         :bigint           not null, primary key
#  role_name  :string(255)      not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class UserRole < ApplicationRecord
  has_many :users
end
