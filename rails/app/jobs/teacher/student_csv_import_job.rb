# frozen_string_literal: true

module Teacher
  class StudentCsvImportJob < ApplicationJob
    queue_as :default

    def perform(import_history_id)
      history = ImportHistory.find(import_history_id)
      Teacher::StudentCsvBatchImportService.new(history).call
    end
  end
end
