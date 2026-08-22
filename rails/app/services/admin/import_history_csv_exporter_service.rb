# frozen_string_literal: true

module Admin
  class ImportHistoryCsvExporterService
    require 'csv'

    BOM = "\uFEFF"
    FORMULA_PREFIXES = ['=', '+', '-', '@'].freeze

    def initialize(import_history)
      @import_history = import_history
    end

    def call
      summary_line = "# total:#{@import_history.total_count}, " \
                     "success:#{@import_history.success_count}, " \
                     "error:#{@import_history.error_count}\n"

      csv = CSV.generate do |c|
        c << %w[row_number status message]

        @import_history.import_errors.each do |import_error|
          c << [import_error.row_number, 'error', escape_formula(import_error.message)]
        end
      end

      "#{BOM}#{summary_line}#{csv}"
    end

    private

    def escape_formula(value)
      return value unless value.is_a?(String)
      return value unless value.start_with?(*FORMULA_PREFIXES)

      "'#{value}"
    end
  end
end
