# frozen_string_literal: true

# == Schema Information
#
# Table name: courses
#
#  id           :bigint           not null, primary key
#  subject_id   :bigint
#  level_number :integer          default(1), not null
#  level_name   :string(255)      not null
#  description  :text(65535)
#  deleted_at   :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
require 'rails_helper'

RSpec.describe Course, type: :model do
  describe '.model_name.human' do
    it 'モデル名が日本語になる' do
      expect(described_class.model_name.human).to eq('コース')
    end
  end
end
