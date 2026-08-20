# frozen_string_literal: true

module Api
  module V1
    module Admin
      class ImportHistoriesController < BaseController
        def index
          per_page = sanitized_per_page
          histories = import_histories_scope.page(sanitized_page).per(per_page)

          render json: {
            import_histories: ActiveModelSerializers::SerializableResource.new(
              histories,
              each_serializer: ::Admin::ImportHistoryListSerializer
            ),
            meta: {
              current_page: histories.current_page,
              total_pages: histories.total_pages,
              total_count: histories.total_count,
              per_page: per_page
            }
          }
        end

        def show
          history = ImportHistory.includes(:user, :import_errors, unit: :course).find(params[:id])

          render json: history, serializer: ::Admin::ImportHistoryDetailSerializer
        end

        def export
          history = ImportHistory.includes(:import_errors).find(params[:id])
          csv = ::Admin::ImportHistoryCsvExporterService.new(history).call

          send_data csv,
                    filename: "import_history_#{history.id}.csv",
                    type: 'text/csv; charset=UTF-8',
                    disposition: 'attachment'
        end

        private

        def import_histories_scope
          ::Admin::ImportHistoriesQuery.new.call(
            params.slice(:status, :unit_id, :course_id, :user_id, :from, :to)
          )
        end
      end
    end
  end
end
