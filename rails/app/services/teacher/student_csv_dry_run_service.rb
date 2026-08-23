# frozen_string_literal: true

module Teacher
  class StudentCsvDryRunService
    def initialize(file, high_school:)
      @file = file
      @high_school = high_school
    end

    def call
      Csv::DryRunService.new(
        @file,
        form_class: Teacher::StudentImportForm,
        form_context: {
          high_school: @high_school,
          duplicate_emails: Teacher::StudentImportForm.duplicate_emails(@file.path)
        }
      ).call
    end
  end
end
