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
        form = build_form(row)
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

    private

    def build_form(row)
      Admin::QuestionImportForm.new(
        question_text: row['問題文'],
        correct_answer: row['正解番号']&.to_i,
        explanation_text: row['解説'],
        choices: [
          row['選択肢1'],
          row['選択肢2'],
          row['選択肢3'],
          row['選択肢4']
        ],
        hints: [
          row['ヒント1'],
          row['ヒント2']
        ].compact_blank
      )
    end
  end
end
