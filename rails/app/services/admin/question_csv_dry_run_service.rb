# frozen_string_literal: true

module Admin
  class QuestionCsvDryRunService
    def initialize(file)
      @file = file
    end

    def call
      Csv::DryRunService.new(@file, form_class: Admin::QuestionImportForm).call
    end
  end
end
