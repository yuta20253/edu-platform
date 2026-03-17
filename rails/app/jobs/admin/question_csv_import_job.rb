# frozen_string_literal: true

module Admin
  class QuestionCsvImportJob < ApplicationJob
    queue_as :default

    def perform(import_history_id)
      history = ImportHistory.find(import_history_id)
      Admin::QuestionCsvBatchImportService.new(history).call
    end
  end
end
