# frozen_string_literal: true

# == Schema Information
#
# Table name: high_schools
#
#  id         :bigint           not null, primary key
#  name       :string(50)       not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class HighSchool < ApplicationRecord
  has_many :users
end
