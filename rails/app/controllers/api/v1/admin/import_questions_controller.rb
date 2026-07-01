# frozen_string_literal: true

module Api
  module V1
    module Admin
      class ImportQuestionsController < Api::V1::Admin::BaseController
        MODES = %w[append overwrite].freeze
        DEFAULT_MODE = 'append'

        def create
          file = import_questions_csv_params[:file]

          Csv::File::FileValidator.new(file).call

          import_history = nil
          ActiveRecord::Base.transaction do
            import_history = current_user.import_histories.create!(
              unit_id: import_questions_csv_params[:unit_id],
              status: :processing,
              mode: import_mode,
              file_name: file.original_filename,
              file_size: file.size,
              content_type: file.content_type
            )
            import_history.file.attach(file)
          end

          ::Admin::QuestionCsvImportJob.perform_later(import_history.id)

          render json: { message: 'インポートを開始しました' }, status: :accepted
        end

        private

        def import_questions_csv_params
          params.permit(:file, :unit_id, :mode)
        end

        # 許可値以外・未指定は append にフォールバックし、既存動作を維持する
        def import_mode
          mode = import_questions_csv_params[:mode]
          MODES.include?(mode) ? mode : DEFAULT_MODE
        end
      end
    end
  end
end
