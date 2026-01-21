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
require 'rails_helper'

RSpec.describe HighSchool, type: :model do
  describe 'バリデーション' do
    it { is_expected.to validate_presence_of(:name) }
  end
end
