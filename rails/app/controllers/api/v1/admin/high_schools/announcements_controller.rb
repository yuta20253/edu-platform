# frozen_string_literal: true

module Api
  module V1
    module Admin
      module HighSchools
        class AnnouncementsController < Api::V1::Admin::BaseController
          def index
            school = HighSchool.find(params[:high_school_id])
            announcements = AnnouncementsQuery.new(Announcement.for_high_school(school.id))
                                              .order_default
                                              .result
                                              .includes(:publisher, :announcement_targets)
                                              .page(sanitized_page).per(sanitized_per_page)

            render json: {
              announcements: ActiveModelSerializers::SerializableResource.new(
                announcements,
                each_serializer: ::Admin::AnnouncementSerializer,
                high_school_id: school.id
              ),
              meta: pagination_meta(announcements)
            }
          end
        end
      end
    end
  end
end
