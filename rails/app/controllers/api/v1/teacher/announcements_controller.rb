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

        def create
          form = ::Teacher::CreateAnnouncementForm.new(current_user: current_user,
                                                       **create_announcement_params.to_h.symbolize_keys)

          if form.save
            render json: { message: 'お知らせを下書きで作成しました。' }, status: :created
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        end

        def update
          form = ::Teacher::UpdateAnnouncementForm.new(current_user: current_user, **update_announcement_params.to_h.symbolize_keys)

          if form.save
            render json: { message: "お知らせを更新しました。" }, status: :ok
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        end

        private

        def create_announcement_params
          params.require(:announcement).permit(:title, :content, announcement_targets: [:target_type])
        end

        def update_announcement_params
          params.require(:announcement).permit(:id, :status)
        end
      end
    end
  end
end
