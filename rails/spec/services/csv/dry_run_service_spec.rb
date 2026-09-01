# frozen_string_literal: true

require 'rails_helper'

# form_classが何のドメインも知らない汎用サービスであることを示すためのテスト用フォーム。
# ActiveModel::Errors#full_messageの内部実装が匿名クラスを許容しないため、名前付きにしている。
class DryRunServiceSpecFakeForm
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :name, :string
  validates :name, presence: true

  # nameのみ必須。ageのような任意項目や、想定外の余分な列があってもよいことを表す。
  REQUIRED_HEADERS = %w[name].freeze

  def self.from_csv_row(row)
    new(name: row['name'])
  end
end

RSpec.describe Csv::DryRunService, type: :service do
  let(:fake_form_class) { DryRunServiceSpecFakeForm }

  let(:file) do
    Tempfile.new(['rows', '.csv']).tap do |f|
      f.write(csv_content)
      f.rewind
    end
  end

  after { file.close! }

  describe '#call' do
    context '全行validな場合' do
      let(:csv_content) { "name,age\nAlice,20\nBob,30\n" }

      it 'total_countとvalid_countが一致しrowsが空になる' do
        result = described_class.new(file, form_class: fake_form_class).call

        expect(result).to eq(total_count: 2, valid_count: 2, rows: [])
      end
    end

    context '一部行がinvalidな場合' do
      let(:csv_content) { "name,age\nAlice,20\n,30\n" }

      it '該当行のみrowsに含まれる' do
        result = described_class.new(file, form_class: fake_form_class).call

        expect(result[:total_count]).to eq(2)
        expect(result[:valid_count]).to eq(1)
        expect(result[:rows].size).to eq(1)

        row = result[:rows].first
        expect(row[:row_number]).to eq(3)
        expect(row[:severity]).to eq('error')
        expect(row[:data]).to eq('name' => nil, 'age' => '30')
      end
    end

    context '無効な行がMAX_ERROR_ROWSを超える場合' do
      let(:row_count) { described_class::MAX_ERROR_ROWS + 10 }
      let(:csv_content) do
        header = "name,age\n"
        rows = (1..row_count).map { ',30' }.join("\n")
        header + rows
      end

      it 'total_count/valid_countは全行分正しく数えるがrowsはMAX_ERROR_ROWS件に切り上げられる' do
        result = described_class.new(file, form_class: fake_form_class).call

        expect(result[:total_count]).to eq(row_count)
        expect(result[:valid_count]).to eq(0)
        expect(result[:rows].size).to eq(described_class::MAX_ERROR_ROWS)
      end
    end

    context 'ヘッダーに必須列(name)が含まれない場合' do
      let(:csv_content) { "other\nAlice\n" }

      it 'Csv::Errors::InvalidHeaderを投げる' do
        expect { described_class.new(file, form_class: fake_form_class).call }
          .to raise_error(Csv::Errors::InvalidHeader, 'CSVのフォーマットが不正です')
      end
    end

    context 'ヘッダーに必須列(name)が含まれ、想定外の列も含む場合' do
      let(:csv_content) { "name,unknown\nAlice,x\n" }

      it '正常に処理される（想定外の列は無視される）' do
        result = described_class.new(file, form_class: fake_form_class).call

        expect(result[:total_count]).to eq(1)
      end
    end
  end
end
