# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::QuestionCsvTemplateService, type: :service do
  describe '#call' do
    subject(:csv) { described_class.new.call }

    let(:bom) { '﻿' }

    it 'UTF-8 BOM付きのCSV文字列を返す' do
      expect(csv).to start_with(bom)
    end

    it 'ヘッダー行が既存インポート実装のカラム順と一致する' do
      parsed = CSV.parse(csv.delete_prefix(bom), headers: true)
      expect(parsed.headers).to eq(
        %w[問題文 正解番号 解説 選択肢1 選択肢2 選択肢3 選択肢4 ヒント1 ヒント2]
      )
    end

    it 'サンプル行が1行だけ含まれる' do
      parsed = CSV.parse(csv.delete_prefix(bom), headers: true)
      expect(parsed.size).to eq(1)
    end

    it 'サンプル行はQuestionImportFormのバリデーションを通過する' do
      parsed = CSV.parse(csv.delete_prefix(bom), headers: true)
      row = parsed.first

      form = Admin::QuestionImportForm.new(
        question_text: row['問題文'],
        correct_answer: row['正解番号']&.to_i,
        explanation_text: row['解説'],
        choices: [row['選択肢1'], row['選択肢2'], row['選択肢3'], row['選択肢4']],
        hints: [row['ヒント1'], row['ヒント2']].compact_blank
      )

      expect(form.valid?).to be true
    end
  end
end
