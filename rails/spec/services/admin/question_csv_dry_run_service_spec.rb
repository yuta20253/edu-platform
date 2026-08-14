# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::QuestionCsvDryRunService, type: :service do
  let(:file) do
    Tempfile.new(['questions', '.csv']).tap do |f|
      f.write(csv_content)
      f.rewind
    end
  end

  after { file.close! }

  describe '#call' do
    context '正常系（全行成功）' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          問題1,1,解説,A,B,C,D
        CSV
      end

      it 'total_countとvalid_countが一致しrowsが空になる' do
        result = described_class.new(file).call

        expect(result).to eq(total_count: 1, valid_count: 1, rows: [])
      end
    end

    context '正常系（複数行、全行成功）' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          問題1,1,解説,A,B,C,D
          問題2,2,解説,A,B,C,D
          問題3,3,解説,A,B,C,D
        CSV
      end

      it 'total_countが行数と一致しrowsが空になる' do
        result = described_class.new(file).call

        expect(result[:total_count]).to eq(3)
        expect(result[:valid_count]).to eq(3)
        expect(result[:rows]).to eq([])
      end
    end

    context '一部行が無効な場合（question_textが空）' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          問題1,1,解説,A,B,C,D
          ,1,解説,A,B,C,D
        CSV
      end

      it '該当行のみrowsに含まれる' do
        result = described_class.new(file).call

        expect(result[:total_count]).to eq(2)
        expect(result[:valid_count]).to eq(1)
        expect(result[:rows].size).to eq(1)

        row = result[:rows].first
        expect(row[:row_number]).to eq(3)
        expect(row[:severity]).to eq('error')
        expect(row[:message]).to include('Question text')
        expect(row[:data]).to eq(
          '問題文' => nil,
          '正解番号' => '1',
          '解説' => '解説',
          '選択肢1' => 'A',
          '選択肢2' => 'B',
          '選択肢3' => 'C',
          '選択肢4' => 'D'
        )
      end
    end

    context '複数行が無効な場合' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          ,1,解説,A,B,C,D
          問題2,1,解説,A,B,C,D
          問題3,,解説,A,B,C,D
        CSV
      end

      it '無効な行だけrowsに集約されvalid_countから除外される' do
        result = described_class.new(file).call

        expect(result[:total_count]).to eq(3)
        expect(result[:valid_count]).to eq(1)
        expect(result[:rows].pluck(:row_number)).to eq([2, 4])
      end
    end

    context '選択肢の一部が空の場合' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          問題1,1,解説,A,B,C,
        CSV
      end

      it 'presenceには引っかからずvalidになる（choices配列自体は4要素のため）' do
        result = described_class.new(file).call

        expect(result[:valid_count]).to eq(1)
        expect(result[:rows]).to eq([])
      end
    end

    context 'ヒント列がヒント1・ヒント2しかCSVから読まれない場合' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4,ヒント1,ヒント2,ヒント3
          問題1,1,解説,A,B,C,D,h1,h2,h3
        CSV
      end

      it 'ヒント3列目は無視されvalidになる' do
        result = described_class.new(file).call

        expect(result[:valid_count]).to eq(1)
        expect(result[:rows]).to eq([])
      end
    end

    context '無効な行がMAX_ERROR_ROWSを超える場合' do
      let(:row_count) { Admin::QuestionCsvDryRunService::MAX_ERROR_ROWS + 10 }
      let(:csv_content) do
        header = "問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4\n"
        rows = (1..row_count).map { ',1,解説,A,B,C,D' }.join("\n")
        header + rows
      end

      it 'total_count/valid_countは全行分正しく数えるがrowsはMAX_ERROR_ROWS件に切り上げられる' do
        result = described_class.new(file).call

        expect(result[:total_count]).to eq(row_count)
        expect(result[:valid_count]).to eq(0)
        expect(result[:rows].size).to eq(Admin::QuestionCsvDryRunService::MAX_ERROR_ROWS)
      end
    end

    context 'DBへの影響' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          問題1,1,解説,A,B,C,D
          ,1,解説,A,B,C,D
        CSV
      end

      it 'Questionが作成されない' do
        expect { described_class.new(file).call }.not_to change(Question, :count)
      end

      it 'ImportHistoryが作成されない' do
        expect { described_class.new(file).call }.not_to change(ImportHistory, :count)
      end

      it 'ImportErrorが作成されない' do
        expect { described_class.new(file).call }.not_to change(ImportError, :count)
      end
    end
  end
end
