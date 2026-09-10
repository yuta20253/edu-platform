# frozen_string_literal: true

module Api
  module V1
    module Admin
      class DashboardsController < BaseController
        def show
          query = ::Admin::DashboardQuery.new

          render json: {
            stats: query.stats,
            recent_imports: ActiveModelSerializers::SerializableResource.new(
              query.recent_imports,
              each_serializer: ImportHistorySerializer
            ),
            recent_announcements: ActiveModelSerializers::SerializableResource.new(
              query.recent_announcements,
              each_serializer: ::Admin::DashboardAnnouncementSerializer
            ),
            meta: {
              active_student_period_days: query.active_within_days,
              generated_at: Time.current
            }
          }
        end
      end
    end
  end
end
