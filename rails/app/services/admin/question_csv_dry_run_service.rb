# frozen_string_literal: true

module Admin
  class QuestionCsvDryRunService
    require 'csv'

    # Step2のプレビューで表示しきれない件数を防ぐため、rowsに積む詳細情報には上限を設ける。
    # total_count/valid_countは上限に関わらず全行を正しく数える。
    MAX_ERROR_ROWS = 100

    def initialize(file)
      @file = file
    end

    def call
      total_count = 0
      error_count = 0
      error_rows = []

      CSV.foreach(@file.path, headers: true, encoding: 'bom|utf-8').with_index(2) do |row, line_number|
        total_count += 1
        form = Admin::QuestionImportForm.from_csv_row(row)
        next if form.valid?

        error_count += 1
        next if error_rows.size >= MAX_ERROR_ROWS

        error_rows << {
          row_number: line_number,
          severity: 'error',
          message: form.errors.full_messages.join(', '),
          data: row.to_h
        }
      end

      {
        total_count: total_count,
        valid_count: total_count - error_count,
        rows: error_rows
      }
    end
  end
end
