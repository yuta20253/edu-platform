# frozen_string_literal: true

module Api
  module V1
    module Admin
      class ImportQuestionsController < Api::V1::Admin::BaseController
        def create
          file = import_questions_csv_params[:file]

          Csv::File::FileValidator.new(file).call

          ActiveRecord::Base.transaction do
            import_history = current_user.import_histories.create!(
              unit_id: import_questions_csv_params[:unit_id],
              status: :processing,
              file_name: file.original_filename,
              file_size: file.size,
              content_type: file.content_type
            )
            import_history.file.attach(file)
          end

          Admin::QuestionCsvImportJob.perform_later(import_history.id)

          render json: { message: 'インポートを開始しました' }, status: :accepted
        end

        private

        def import_questions_csv_params
          params.permit(:file, :unit_id)
        end
      end
    end
  end
end
