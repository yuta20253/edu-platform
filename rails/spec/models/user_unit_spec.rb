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
require 'rails_helper'

RSpec.describe UserUnit, type: :model do
  pending "add some examples to (or delete) #{__FILE__}"
end
