# frozen_string_literal: true

module Csv
  # CSVを1行ずつformでバリデーションするだけの汎用dry run。DBへの作成・更新は行わない。
  # form_classは `.from_csv_row(row)` を実装している必要がある。
  class DryRunService
    require 'csv'

    # プレビューで表示しきれない件数を防ぐため、rowsに積む詳細情報には上限を設ける。
    # total_count/valid_countは上限に関わらず全行を正しく数える。
    MAX_ERROR_ROWS = 100

    # form_context: form_class.from_csv_row(row, **form_context) にそのまま渡すキーワード引数。
    # 行単体では判断できない検証(例: 所属高校スコープでの学年・学級の存在確認)に使う。
    # form_classは `.from_csv_row(row)` に加え、必須のCSVヘッダー配列を定数 `REQUIRED_HEADERS` として持つ必要がある。
    def initialize(file, form_class:, form_context: {})
      @file = file
      @form_class = form_class
      @form_context = form_context
    end

    def call
      validate_headers!

      total_count = 0
      error_count = 0
      error_rows = []

      CSV.foreach(@file.path, headers: true, encoding: 'bom|utf-8').with_index(2) do |row, line_number|
        total_count += 1
        form = @form_class.from_csv_row(row, **@form_context)
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

    private

    # 列名の誤りなど明らかにフォーマットが違うCSVを、1行ずつのバリデーションエラーに埋もれさせず
    # 明確なエラーとして即座に返す。
    def validate_headers!
      Csv::HeaderValidator.new(@file.path, @form_class).call
    end
  end
end
