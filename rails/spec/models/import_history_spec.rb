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

  describe '#import_errors' do
    let!(:history) { create(:import_history) }
    let!(:later_row) { create(:import_error, import_history: history, row_number: 5) }
    let!(:earlier_row) { create(:import_error, import_history: history, row_number: 2) }

    it 'row_number 昇順で返る（作成順に依らない）' do
      expect(history.import_errors).to eq([earlier_row, later_row])
    end

    it 'includes で preload しても追加クエリなしに row_number 昇順のまま返る' do
      reloaded = described_class.includes(:import_errors).find(history.id)

      queries = []
      callback = lambda { |_n, _s, _f, _id, payload|
        queries << payload[:sql] if payload[:name] != 'SCHEMA'
      }
      result = nil
      ActiveSupport::Notifications.subscribed(callback, 'sql.active_record') do
        result = reloaded.import_errors.to_a
      end

      expect(result).to eq([earlier_row, later_row])
      expect(queries).to be_empty
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

  describe 'import_type enum' do
    it 'question / student を持つ' do
      expect(described_class.import_types.keys).to contain_exactly('question', 'student')
    end

    it 'デフォルトは question' do
      expect(build(:import_history).import_type).to eq('question')
    end

    it '不正な import_type は validation で弾かれる' do
      history = build(:import_history)
      history.import_type = 'invalid_type'

      expect(history).not_to be_valid
      expect(history.errors[:import_type]).to be_present
    end
  end

  describe 'unit の必須性' do
    it 'question の場合は unit が必須' do
      history = build(:import_history, unit: nil, import_type: :question)

      expect(history).not_to be_valid
      expect(history.errors[:unit]).to be_present
    end

    it 'student の場合は unit がなくても有効' do
      history = build(:import_history, unit: nil, import_type: :student)

      expect(history).to be_valid
    end
  end
end
