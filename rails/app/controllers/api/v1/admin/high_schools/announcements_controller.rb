# frozen_string_literal: true

module Api
  module V1
    module Admin
      module HighSchools
        class AnnouncementsController < Api::V1::Admin::BaseController
          def index
            school = HighSchool.find(params[:high_school_id])
            per_page = sanitized_per_page
            announcements = AnnouncementsQuery.new(Announcement.for_high_school(school.id))
                                              .order_default
                                              .result
                                              .includes(:publisher, :announcement_targets)
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
end
