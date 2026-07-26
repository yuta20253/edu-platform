# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::Calculator do
  describe '.completion_rate' do
    it '完了率を返す' do
      expect(described_class.completion_rate(3, 5)).to eq(60.0)
    end

    it '総数が0の場合は0を返す' do
      expect(described_class.completion_rate(0, 0)).to eq(0)
    end
  end

  describe '.correct_rate' do
    let(:histories) do
      [
        build_stubbed(:question_history, is_correct: true),
        build_stubbed(:question_history, is_correct: false),
        build_stubbed(:question_history, is_correct: true)
      ]
    end

    it '正答率を返す' do
      expect(described_class.correct_rate(histories)).to eq(66.7)
    end

    it '履歴がない場合は0を返す' do
      expect(described_class.correct_rate([])).to eq(0)
    end
  end

  describe '.correct_rate_from_counts' do
    it '正答率を返す' do
      expect(described_class.correct_rate_from_counts(2, 3)).to eq(66.7)
    end

    it '総数が0の場合は0を返す' do
      expect(described_class.correct_rate_from_counts(0, 0)).to eq(0)
    end
  end
end
