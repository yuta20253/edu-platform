# frozen_string_literal: true

module Csv
  # CSVの実ヘッダーがform_class::HEADERSの範囲内か確認する。
  # HEADERSには任意項目(例: ヒント)も含まれるため一致ではなく包含関係で見る。
  class HeaderValidator
    require 'csv'

    def initialize(path, form_class)
      @path = path
      @form_class = form_class
    end

    def call
      actual_headers = CSV.foreach(@path, encoding: 'bom|utf-8').first

      return if actual_headers.present? && (actual_headers - @form_class::HEADERS).empty?

      raise Csv::Errors::InvalidHeader, 'CSVのフォーマットが不正です'
    end
  end
end
