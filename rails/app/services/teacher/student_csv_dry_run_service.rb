# frozen_string_literal: true

module Teacher
  class StudentCsvDryRunService
    def initialize(file, high_school:, current_user: nil)
      @file = file
      @high_school = high_school
      @current_user = current_user
    end

    def call
      Csv::DryRunService.new(
        @file,
        form_class: Teacher::StudentImportForm,
        form_context: {
          high_school: @high_school,
          duplicate_emails: Teacher::StudentImportForm.duplicate_emails(@file.path),
          current_user: @current_user
        }
      ).call
    end
  end
end
