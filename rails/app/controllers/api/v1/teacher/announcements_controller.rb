# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class AnnouncementsController < Api::V1::Teacher::BaseController
        # お知らせ一覧取得(関係するお知らせのみ)
        def index
          announcements = Announcement
                          .for_user(current_user)
                          .published
                          .order(published_at: :desc)
                          .page(params[:page])
                          .per(20)

          render json: announcements,
                 each_serializer: AnnouncementSerializer,
                 status: :ok
        end

        def show
          announcement = Announcement.for_user(current_user).published.find(params[:id])

          render json: announcement, serializer: AnnouncementSerializer, status: :ok
        end
      end
    end
  end
end
