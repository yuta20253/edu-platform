# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::UpdateAnnouncementForm, type: :model do
  describe '#human_attribute_name' do
    it '項目名が日本語になる' do
      expect(described_class.human_attribute_name(:title)).to eq('タイトル')
      expect(described_class.human_attribute_name(:content)).to eq('本文')
    end
  end
end
