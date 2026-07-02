# frozen_string_literal: true

module Api
  module V1
    module Admin
      class ImportQuestionsController < Api::V1::Admin::BaseController
        DEFAULT_MODE = 'append'

        def create
          unit = find_unit!
          file = import_questions_csv_params[:file]

          Csv::File::FileValidator.new(file).call

          import_history = nil
          ActiveRecord::Base.transaction do
            import_history = current_user.import_histories.create!(
              unit_id: unit.id,
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

        # 破壊的な操作のため、対象単元は route の course/unit で厳密にスコープする。
        # body の unit_id は信用しない（IDOR 防止）。
        def find_unit!
          unit = Unit.active.find_by(id: params[:unit_id], course_id: params[:course_id])
          raise ActiveRecord::RecordNotFound.new(nil, Unit.name) if unit.nil?

          unit
        end

        def import_questions_csv_params
          params.permit(:file, :mode)
        end

        # 許可値(enumのキー)以外・未指定は append にフォールバックし、既存動作を維持する
        def import_mode
          mode = import_questions_csv_params[:mode]
          ImportHistory.modes.key?(mode) ? mode : DEFAULT_MODE
        end
      end
    end
  end
end
