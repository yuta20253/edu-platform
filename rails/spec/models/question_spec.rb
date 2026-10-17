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

  describe '.in_active_units' do
    let!(:active_unit) { create(:unit) }
    let!(:deleted_unit) { create(:unit, deleted_at: Time.current) }
    let!(:question_in_active_unit) { create(:question, unit: active_unit) }
    let!(:deleted_question_in_active_unit) { create(:question, unit: active_unit, deleted_at: Time.current) }
    let!(:question_in_deleted_unit) { create(:question, unit: deleted_unit) }

    it '論理削除されていない単元に属する有効な問題だけを返す' do
      expect(described_class.in_active_units).to contain_exactly(question_in_active_unit)
    end

    it 'units テーブルをjoinしているので units の条件で絞り込める' do
      expect(described_class.in_active_units.where(units: { id: active_unit.id }))
        .to contain_exactly(question_in_active_unit)
    end
  end
end
