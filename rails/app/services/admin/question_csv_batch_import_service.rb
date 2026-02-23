# frozen_string_literal: true

module Admin
  class QuestionCsvBatchImportService
    require 'csv'
    def initialize(import_history)
      @import_history = import_history
      @unit_id = import_history.unit_id
      @file = import_history.file
    end

    def call
      ActiveRecord::Base.transaction do
        @file.open do |template|
          CSV.foreach(template.path, headers: true, encoding: 'bom|utf-8').with_index(2) do |row, line_number|
            process_row(row, line_number)
          end
        end
      end
      @import_history.completed!
    rescue CsvImportError
      @import_history.failed!
    rescue StandardError => e
      @import_history.failed!
      raise e
    end

    private

    def process_row(row, line_number)
      form = build_form(row)

      raise CsvImportError, "Line #{line_number}: #{form.errors.full_messages.join(', ')}" unless form.valid?

      Admin::QuestionCsvImportService.new(form, @unit_id).call
    end

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
        ].compact
      )
    end
  end
end
