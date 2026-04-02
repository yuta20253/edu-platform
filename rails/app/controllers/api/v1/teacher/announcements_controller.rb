# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class AnnouncementsController < Api::V1::Teacher::BaseController
        def index
          announcements = Announcement
                          .for_user(current_user)
                          .published
                          .order(published_at: :desc)
                          .page(params[:page])
                          .per(20)

          render json: {
                   announcements:
                    ActiveModelSerializers::SerializableResource.new(
                      announcements,
                      each_serializer: AnnouncementSerializer
                    ),
                   meta: {
                     current_page: announcements.current_page,
                     total_pages: announcements.total_pages,
                     total_count: announcements.total_count,
                     per_page: 20
                   }
                 },
                 status: :ok
        end
      end
    end
  end
end
