# frozen_string_literal: true

module Api
  module V1
    module Student
      class AnnouncementsController < Api::V1::Student::BaseController
        def index
          announcements = announcement_scope
                          .order(published_at: :desc, id: :desc)
                          .page(params[:page])
                          .per(20)

          render json: {
            announcements: ActiveModelSerializers::SerializableResource.new(
              announcements, each_serializer: AnnouncementSerializer
            ),
            meta: {
              current_page: announcements.current_page,
              total_pages: announcements.total_pages,
              total_count: announcements.total_count,
              per_page: 20
            }
          }
        end

        def show
          announcement = announcement_scope.find(params[:id])

          render json: announcement, serializer: AnnouncementSerializer, status: :ok
        end

        private

        def announcement_scope
          Announcement.for_user(current_user).includes(:publisher).published
        end
      end
    end
  end
end
