# frozen_string_literal: true

# == Schema Information
#
# Table name: addresses
#
#  id             :bigint           not null, primary key
#  postal_code    :string(8)        not null
#  prefecture     :string(20)       not null
#  city           :string(50)       not null
#  town           :string(50)
#  street_address :string(100)
#  deleted_at     :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class Address < ApplicationRecord
  has_many :users
end
