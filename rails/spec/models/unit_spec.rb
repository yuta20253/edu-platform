# frozen_string_literal: true

# == Schema Information
#
# Table name: units
#
#  id         :bigint           not null, primary key
#  course_id  :bigint           not null
#  unit_name  :string(255)      not null
#  deleted_at :datetime
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require 'rails_helper'

RSpec.describe Unit, type: :model do
  describe '.model_name.human' do
    it 'モデル名が日本語になる' do
      expect(described_class.model_name.human).to eq('単元')
    end
  end
end
