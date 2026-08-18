# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::ImportHistoryCsvExporterService, type: :model do
  describe '#call' do
    subject(:csv) { described_class.new(history).call }

    let(:history) do
      create(:import_history, status: :completed, total_count: 3, success_count: 1, error_count: 2)
    end

    context 'エラー行が存在する場合' do
      before do
        create(:import_error, import_history: history, row_number: 3, message: '問題文は必須です')
        create(:import_error, import_history: history, row_number: 5, message: '正解の形式が不正')
      end

      it 'BOM付きで始まる' do
        expect(csv).to start_with('﻿')
      end

      it 'サマリーコメント行に total/success/error 件数を含む' do
        summary_line = csv.delete_prefix('﻿').lines.first
        expect(summary_line).to include('total:3', 'success:1', 'error:2')
      end

      it 'ヘッダー行に row_number, status, message を含む' do
        rows = CSV.parse(csv.delete_prefix('﻿'), skip_lines: /\A#/)
        expect(rows.first).to eq(%w[row_number status message])
      end

      it 'row_number 昇順でエラー行が出力される' do
        rows = CSV.parse(csv.delete_prefix('﻿'), headers: true, skip_lines: /\A#/)
        expect(rows.pluck('row_number')).to eq(%w[3 5])
      end

      it '各行の status は error、message はエラー内容' do
        rows = CSV.parse(csv.delete_prefix('﻿'), headers: true, skip_lines: /\A#/)
        expect(rows.pluck('status')).to all(eq('error'))
        expect(rows.first['message']).to eq('問題文は必須です')
      end
    end

    context 'エラー行が存在しない場合' do
      it 'ヘッダー行のみでエラー行は出力されない' do
        rows = CSV.parse(csv.delete_prefix('﻿'), headers: true, skip_lines: /\A#/)
        expect(rows.size).to eq(0)
      end

      it 'サマリーコメント行は出力される' do
        summary_line = csv.delete_prefix('﻿').lines.first
        expect(summary_line).to include('total:3', 'success:1', 'error:2')
      end
    end
  end
end
