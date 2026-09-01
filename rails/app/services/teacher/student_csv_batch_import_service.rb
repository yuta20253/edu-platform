# frozen_string_literal: true

module Teacher
  class StudentCsvBatchImportService
    def initialize(import_history)
      @import_history = import_history
      @high_school = import_history.user.high_school
    end

    def call
      Csv::BatchImportService.new(
        @import_history,
        form_class: Teacher::StudentImportForm,
        form_context: {
          high_school: @high_school,
          duplicate_emails: duplicate_emails,
          current_user: @import_history.user
        },
        row_importer: ->(form) { Teacher::StudentCsvImportService.new(form).call }
      ).call
    end

    private

    def duplicate_emails
      @import_history.file.open do |file|
        Teacher::StudentImportForm.duplicate_emails(file.path)
      end
    end
  end
end
