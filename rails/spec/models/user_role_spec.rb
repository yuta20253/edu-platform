# frozen_string_literal: true

# == Schema Information
#
# Table name: user_roles
#
#  id         :bigint           not null, primary key
#  name       :integer          default("student"), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require 'rails_helper'

RSpec.describe UserRole, type: :model do
  describe 'バリデーション' do
    it { is_expected.to validate_presence_of(:name) }
  end
end
