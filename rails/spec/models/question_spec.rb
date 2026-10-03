# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Question, type: :model do
  describe 'default_scope' do
    let!(:question) { create(:question) }
    let!(:deleted_question) { create(:question, deleted_at: Time.current) }

    it '論理削除済みの問題は取得されない' do
      expect(described_class.all).to contain_exactly(question)
    end

    it 'unscopedで論理削除済みの問題も取得できる' do
      expect(described_class.unscoped).to contain_exactly(question, deleted_question)
    end

    it '論理削除済みの問題はfindできない' do
      expect { described_class.find(deleted_question.id) }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
