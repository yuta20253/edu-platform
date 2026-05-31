# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class AnnouncementsController < Api::V1::Teacher::BaseController
        before_action :set_announcement, only: :update
        # お知らせ一覧取得(関係するお知らせのみ)
        def index
          announcements = Announcement
                          .for_user(current_user)
                          .published
                          .order(published_at: :desc)
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
          if @announcement.update(update_announcement_params)
            render json: { message: 'お知らせのステータスを更新しました。' }, status: :ok
          else
            render json: { errors: @announcement.errors.full_messages }, status: :unprocessable_content
          end
        end

        private

        def set_announcement
          @announcement = current_user.announcements.find(params[:id])
        end

        def create_announcement_params
          params.require(:announcement).permit(:title, :content, announcement_targets: [:target_type])
        end

        def update_announcement_params
          params.require(:announcement).permit(:status, :scheduled_at)
        end
      end
    end
  end
end
