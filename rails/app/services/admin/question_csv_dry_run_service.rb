# frozen_string_literal: true

module Admin
  class QuestionCsvDryRunService
    require 'csv'

    def initialize(file)
      @file = file
    end

    def call
      total_count = 0
      error_rows = []

      CSV.foreach(@file.path, headers: true, encoding: 'bom|utf-8').with_index(2) do |row, line_number|
        total_count += 1
        form = Admin::QuestionImportForm.from_csv_row(row)
        next if form.valid?

        error_rows << {
          row_number: line_number,
          severity: 'error',
          message: form.errors.full_messages.join(', '),
          data: row.to_h
        }
      end

      {
        total_count: total_count,
        valid_count: total_count - error_rows.size,
        rows: error_rows
      }
    end
  end
end
