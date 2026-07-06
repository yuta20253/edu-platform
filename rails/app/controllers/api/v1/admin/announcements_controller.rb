# frozen_string_literal: true

module Api
  module V1
    module Admin
      class AnnouncementsController < BaseController
        def index
          school = HighSchool.find(params[:high_school_id])
          per_page = sanitized_per_page
          announcements = Announcement
                          .joins(:announcement_targets)
                          .where(announcement_targets: { high_school_id: school.id })
                          .includes(:publisher, :announcement_targets)
                          .distinct
                          .order(created_at: :desc, id: :desc)
                          .page(sanitized_page).per(per_page)

          render json: {
            announcements: ActiveModelSerializers::SerializableResource.new(
              announcements,
              each_serializer: ::Admin::AnnouncementSerializer,
              high_school_id: school.id
            ),
            meta: {
              current_page: announcements.current_page,
              total_pages: announcements.total_pages,
              total_count: announcements.total_count,
              per_page: per_page
            }
          }
        end
      end
    end
  end
end
