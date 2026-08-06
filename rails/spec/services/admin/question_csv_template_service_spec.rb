# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::QuestionCsvTemplateService, type: :service do
  describe '#call' do
    subject(:csv) { described_class.new.call }

    let(:bom) { '﻿' }

    it 'UTF-8 BOM付きのCSV文字列を返す' do
      expect(csv).to start_with(bom)
    end

    it 'ヘッダー行がAdmin::QuestionImportForm::HEADERSと一致する' do
      parsed = CSV.parse(csv.delete_prefix(bom), headers: true)
      expect(parsed.headers).to eq(Admin::QuestionImportForm::HEADERS)
    end

    it 'サンプル行が1行だけ含まれる' do
      parsed = CSV.parse(csv.delete_prefix(bom), headers: true)
      expect(parsed.size).to eq(1)
    end

    it 'サンプル行はQuestionImportFormのバリデーションを通過する' do
      parsed = CSV.parse(csv.delete_prefix(bom), headers: true)
      row = parsed.first

      form = Admin::QuestionImportForm.from_csv_row(row)

      expect(form.valid?).to be true
    end
  end
end
