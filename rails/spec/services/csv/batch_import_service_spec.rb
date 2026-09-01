# frozen_string_literal: true

require 'rails_helper'

# form_classが何のドメインも知らない汎用サービスであることを示すためのテスト用フォーム。
# ActiveModel::Errors#full_messageの内部実装が匿名クラスを許容しないため、名前付きにしている。
class BatchImportServiceSpecFakeForm
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

RSpec.describe Csv::BatchImportService, type: :service do
  let(:fake_form_class) { BatchImportServiceSpecFakeForm }

  let(:user) { create(:user, :admin, high_school: nil) }
  let(:prefecture) { create(:prefecture) }

  let!(:import_history) do
    ih = create(:import_history, user: user, unit: nil, import_type: :student)
    ih.file.attach(io: StringIO.new(csv_content), filename: 'rows.csv', content_type: 'text/csv')
    ih
  end

  def runner(row_importer:, before_rows: nil)
    described_class.new(
      import_history,
      form_class: fake_form_class,
      row_importer: row_importer,
      before_rows: before_rows
    )
  end

  describe '#call' do
    context '全行valid' do
      let(:csv_content) { "name\nAlice\nBob\n" }

      it '行ごとにrow_importerが呼ばれDBへ書き込まれ、ImportHistoryがcompletedになる' do
        row_importer = ->(form) { HighSchool.create!(name: form.name, prefecture: prefecture) }

        expect { runner(row_importer: row_importer).call }.to change(HighSchool, :count).by(2)

        import_history.reload
        expect(import_history.status).to eq('completed')
        expect(import_history.success_count).to eq(2)
        expect(import_history.total_count).to eq(2)
      end
    end

    context '一部行がinvalid' do
      let(:csv_content) { "name\nAlice\n\n" }

      it '無効な行はrow_importerを呼ばずImportErrorとして記録し、failedになる' do
        called_with = []
        row_importer = ->(form) { called_with << form.name }

        expect { runner(row_importer: row_importer).call }.to change(ImportError, :count).by(1)

        expect(called_with).to eq(['Alice'])
        import_history.reload
        expect(import_history.status).to eq('failed')
        expect(import_history.error_count).to eq(1)

        error = import_history.import_errors.first
        expect(error.row_number).to eq(3)
      end
    end

    context '途中行でエラーが発生した場合' do
      let(:csv_content) { "name\nAlice\n\n" }

      it 'トランザクションがロールバックされ、有効行の書き込みも取り消される' do
        row_importer = ->(form) { HighSchool.create!(name: form.name, prefecture: prefecture) }

        expect { runner(row_importer: row_importer).call }.not_to change(HighSchool, :count)
      end
    end

    context 'row_importerがStandardErrorを投げた場合' do
      let(:csv_content) { "name\nAlice\n" }

      it 'failedになるが例外はそのまま上がる' do
        row_importer = ->(_form) { raise StandardError, 'boom' }

        expect { runner(row_importer: row_importer).call }.to raise_error(StandardError, 'boom')

        import_history.reload
        expect(import_history.status).to eq('failed')
        expect(import_history.finished_at).to be_present
      end
    end

    context 'ヘッダーに必須列(name)が含まれない場合' do
      let(:csv_content) { "other\nAlice\n" }

      it '行の処理・before_rowsを行わずImportErrorを1件記録しfailedになる' do
        calls = []
        row_importer = ->(form) { calls << form.name }
        before_rows = -> { calls << :before }

        expect { runner(row_importer: row_importer, before_rows: before_rows).call }
          .to change(ImportError, :count).by(1)

        expect(calls).to eq([])
        import_history.reload
        expect(import_history.status).to eq('failed')
        expect(import_history.total_count).to eq(0)
        expect(import_history.error_count).to eq(1)

        error = import_history.import_errors.first
        expect(error.row_number).to eq(1)
        expect(error.message).to eq('CSVのフォーマットが不正です')
      end
    end

    context 'ヘッダーに必須列(name)が含まれ、想定外の列も含む場合' do
      let(:csv_content) { "name,unknown\nAlice,x\n" }

      it '想定外の列は無視され正常に処理される' do
        row_importer = ->(form) { HighSchool.create!(name: form.name, prefecture: prefecture) }

        expect { runner(row_importer: row_importer).call }.to change(HighSchool, :count).by(1)

        import_history.reload
        expect(import_history.status).to eq('completed')
      end
    end

    context 'before_rowsフックが指定されている場合' do
      let(:csv_content) { "name\nAlice\n" }

      it '行処理の前に一度だけ呼ばれる' do
        calls = []
        row_importer = ->(form) { calls << [:row, form.name] }
        before_rows = -> { calls << [:before] }

        runner(row_importer: row_importer, before_rows: before_rows).call

        expect(calls).to eq([[:before], [:row, 'Alice']])
      end
    end
  end
end
