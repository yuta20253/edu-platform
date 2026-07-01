# frozen_string_literal: true

module Api
  module V1
    module Admin
      class AnnouncementsController < BaseController
        def index
          school = HighSchool.find(params[:high_school_id])
          announcements = Announcement
                          .joins(:announcement_targets)
                          .where(announcement_targets: { high_school_id: school.id })
                          .includes(:publisher, :announcement_targets)
                          .distinct
                          .order(created_at: :desc, id: :desc)

          render json: {
            announcements: ActiveModelSerializers::SerializableResource.new(
              announcements,
              each_serializer: ::Admin::AnnouncementSerializer,
              high_school_id: school.id
            )
          }
        end
      end
    end
  end
end
