# frozen_string_literal: true

module Admin
  class QuestionCsvTemplateService
    require 'csv'

    BOM = "\uFEFF"

    SAMPLE_ROW = %w[
      サンプル問題文 1 サンプル解説
      選択肢A 選択肢B 選択肢C 選択肢D
      ヒント1のサンプル ヒント2のサンプル
    ].freeze

    def call
      csv = CSV.generate(headers: true) do |c|
        c << Admin::QuestionImportForm::HEADERS
        c << SAMPLE_ROW
      end

      "#{BOM}#{csv}"
    end
  end
end
