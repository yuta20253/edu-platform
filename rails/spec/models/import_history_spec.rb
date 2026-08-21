# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ImportHistory, type: :model do
  describe '.active' do
    let!(:alive) { create(:import_history) }
    let!(:dead) { create(:import_history, deleted_at: Time.current) }

    it 'deleted_at が NULL のレコードのみ返す' do
      expect(described_class.active).to contain_exactly(alive)
    end
  end

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
