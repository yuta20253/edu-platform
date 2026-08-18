# frozen_string_literal: true

module Api
  module V1
    module Admin
      class ImportHistoriesController < BaseController
        def index
          per_page = sanitized_per_page
          histories = ::Admin::ImportHistoriesQuery.new
                                                   .by_status(params[:status])
                                                   .by_unit_id(params[:unit_id])
                                                   .by_course_id(params[:course_id])
                                                   .by_user_id(params[:user_id])
                                                   .by_period(params[:from], params[:to])
                                                   .order_by_created_at_desc
                                                   .result
                                                   .page(sanitized_page).per(per_page)

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
      end
    end
  end
end
