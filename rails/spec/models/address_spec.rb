# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Address, type: :model do
  describe '.active' do
    let!(:active_address) { create(:address) }
    let!(:deleted_address) { create(:address, deleted_at: Time.current) }

    it '論理削除されていない住所のみ返す' do
      expect(described_class.active).to contain_exactly(active_address)
    end

    it '論理削除済みの住所は含まれない' do
      expect(described_class.active).not_to include(deleted_address)
    end
  end
end
