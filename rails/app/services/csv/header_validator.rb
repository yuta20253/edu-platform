# frozen_string_literal: true

module Csv
  # CSVの実ヘッダーにform_class::REQUIRED_HEADERSが全て含まれているか確認する。
  # 任意項目(例: ヒント)の欠落や、想定外の余分な列の混入は許容し、必須列の欠落のみをフォーマット不正として扱う。
  class HeaderValidator
    require 'csv'

    def initialize(path, form_class)
      @path = path
      @form_class = form_class
    end

    def call
      actual_headers = begin
        CSV.foreach(@path, encoding: 'bom|utf-8').first
      rescue CSV::MalformedCSVError
        # 文字コード違い(Shift_JIS等)や壊れたCSV構文は、ヘッダー欠落と同じ「フォーマット不正」として扱う。
        nil
      end

      return if actual_headers.present? && (@form_class::REQUIRED_HEADERS - actual_headers).empty?

      raise Csv::Errors::InvalidHeader, 'CSVのフォーマットが不正です'
    end
  end
end
