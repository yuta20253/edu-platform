# frozen_string_literal: true

module Csv
  # ImportHistoryのステータス遷移・ImportErrorの蓄積保存・トランザクション制御(全件成功 or 全件失敗)
  # を担う汎用サービス。行ごとのDB書き込みはrow_importerに委譲する。
  # form_classは `.from_csv_row(row)` を実装している必要がある。
  class BatchImportService
    require 'csv'

    # before_rows: トランザクション内・CSV行処理の前に一度だけ呼ぶフック(overwriteモードの事前削除等)
    # row_importer: 有効な行1件ごとに form を渡して呼ぶ callable。実際のUpsert処理を担う
    # form_context: form_class.from_csv_row(row, **form_context) にそのまま渡すキーワード引数
    def initialize(import_history, form_class:, row_importer:, before_rows: nil, form_context: {})
      @import_history = import_history
      @file = import_history.file
      @form_class = form_class
      @row_importer = row_importer
      @before_rows = before_rows
      @form_context = form_context
      @errors = []
      @total_count = 0
    end

    def call
      start_import!

      begin
        ActiveRecord::Base.transaction do
          @before_rows&.call

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
        fail_import!
        raise e
      end
    end

    private

    def process_row(row, line_number)
      form = @form_class.from_csv_row(row, **@form_context)

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

      @row_importer.call(form)
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

    def save_errors
      return if @errors.empty?

      ImportError.insert_all(@errors)
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
