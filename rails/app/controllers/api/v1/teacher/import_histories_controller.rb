class Api::V1::Teacher::ImportHistoriesController < Api::V1::Teacher::BaseController
  def index
    per_page = sanitized_per_page
    histories = import_histories_scope.page(sanitized_page).per(per_page)

    render json: {
      import_histories: ActiveModelSerializers::SerializableResource.new(
        histories,
        each_serializer: ::Teacher::ImportHistoryListSerializer
      ),
      meta: {
        current_page: histories.current_page,
        total_pages: histories.total_pages,
        total_count: histories.total_count,
        per_page: histories.limit_value
      }
    }
  end

  def show
    history = import_histories_scope.find(params[:id])

    render json: history, serializer: ::Teacher::ImportHistoryDetailSerializer
  end

  private

  def import_histories_scope
    @import_histories ||= ::Teacher::ImportHistoriesQuery.new(current_user).call(params.slice(:status, :from, :to, :sort, :order))
  end
end
