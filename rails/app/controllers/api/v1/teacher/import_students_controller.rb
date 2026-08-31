# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class ImportStudentsController < Api::V1::Teacher::BaseController
        DEFAULT_MODE = 'append'

        def create
          file = import_students_csv_params[:file]

          Csv::File::FileValidator.new(file).call

          import_history = nil
          ActiveRecord::Base.transaction do
            import_history = current_user.import_histories.create!(
              import_type: :student,
              status: :processing,
              mode: import_mode,
              file_name: file.original_filename,
              file_size: file.size,
              content_type: file.content_type
            )
            import_history.file.attach(file)
          end

          ::Teacher::StudentCsvImportJob.perform_later(import_history.id)

          render json: { message: 'インポートを開始しました' }, status: :accepted
        end

        def dry_run
          file = import_students_csv_params[:file]

          Csv::File::FileValidator.new(file).call

          result = ::Teacher::StudentCsvDryRunService.new(
            file,
            high_school: current_user.high_school,
            current_user: current_user
          ).call

          render json: result, status: :ok
        end

        private

        def import_students_csv_params
          params.permit(:file, :mode)
        end

        # 許可値(enumのキー)以外・未指定は append にフォールバックし、既存動作を維持する
        def import_mode
          mode = import_students_csv_params[:mode]
          ImportHistory.modes.key?(mode) ? mode : DEFAULT_MODE
        end
      end
    end
  end
end
