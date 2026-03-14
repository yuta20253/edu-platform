# frozen_string_literal: true

module Admin
  class QuestionCsvBatchImportService
    require 'csv'
    def initialize(import_history)
      @import_history = import_history
      @unit_id = import_history.unit_id
      @file = import_history.file
      @errors = []
      @total_count = 0
    end

    def call
      start_import!

      ActiveRecord::Base.transaction do
        @file.open do |template|
          CSV.foreach(template.path, headers: true, encoding: 'bom|utf-8').with_index(2) do |row, line_number|
            @total_count += 1
            process_row(row, line_number)
          end
        end

        raise CsvImportError if @errors.any?
      end

      complete_import!
    rescue CsvImportError
      save_errors
      fail_import!
    rescue StandardError => e
      @import_history.failed!
      raise e
    end

    private

    def process_row(row, line_number)
      form = build_form(row)

      unless form.valid?
        @errors << {
          import_history_id: @import_history.id,
          row_number: line_number,
          message: form.errors.full_messages.join(', '),
          created_at: Time.current,
          updated_at: Time.current
        }
        return
      end

      Admin::QuestionCsvImportService.new(form, @unit_id).call
    end

    def save_errors
      ImportError.insert_all(@errors) if @errors.any?
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

    def start_import!
      @import_history.update!(
        status: :processing,
        started_at: Time.current
      )
    end

    def complete_import!
      @import_history.update!(
        status: :completed,
        finished_at: Time.current,
        success_count: @total_count,
        total_count: @total_count
      )
    end

    def fail_import!
      @import_history.update!(
        status: :failed,
        finished_at: Time.current,
        error_count: @errors.size,
        total_count: @total_count
      )
    end
  end
end
