# frozen_string_literal: true

require 'rails_helper'

RSpec.describe QuestionExplanation, type: :model do
  describe 'default_scope' do
    let!(:record) { create(:question_explanation) }
    let!(:deleted_record) { create(:question_explanation, deleted_at: Time.current) }

    it '論理削除済みのレコードは取得されない' do
      expect(described_class.all).to contain_exactly(record)
    end

    it 'unscopedで論理削除済みのレコードも取得できる' do
      expect(described_class.unscoped).to contain_exactly(record, deleted_record)
    end
  end
end
