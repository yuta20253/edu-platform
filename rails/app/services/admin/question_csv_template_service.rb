# frozen_string_literal: true

module Admin
  class QuestionCsvTemplateService
    require 'csv'

    BOM = '﻿'

    # Admin::QuestionCsvBatchImportService#build_form が読むカラム順と一致させること
    HEADERS = %w[問題文 正解番号 解説 選択肢1 選択肢2 選択肢3 選択肢4 ヒント1 ヒント2].freeze
    SAMPLE_ROW = %w[
      サンプル問題文 1 サンプル解説
      選択肢A 選択肢B 選択肢C 選択肢D
      ヒント1のサンプル ヒント2のサンプル
    ].freeze

    def call
      csv = CSV.generate(headers: true) do |c|
        c << HEADERS
        c << SAMPLE_ROW
      end

      "#{BOM}#{csv}"
    end
  end
end
