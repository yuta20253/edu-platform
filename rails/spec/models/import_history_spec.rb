# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ImportHistory, type: :model do
  describe 'mode enum' do
    it 'append / overwrite を持つ' do
      expect(described_class.modes.keys).to contain_exactly('append', 'overwrite')
    end

    it '不正な mode は validation で弾かれる' do
      history = build(:import_history, mode: :append)
      history.mode = 'invalid_mode'

      expect(history).not_to be_valid
      expect(history.errors[:mode]).to be_present
    end
  end
end
