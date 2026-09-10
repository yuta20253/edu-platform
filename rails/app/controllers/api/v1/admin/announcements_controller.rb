# frozen_string_literal: true

module Api
  module V1
    module Admin
      class AnnouncementsController < BaseController
        before_action :set_announcement, only: %i[show update destroy publish]

        rescue_from ActiveRecord::RecordNotDestroyed do |e|
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        def index
          announcements = AnnouncementsQuery.new
                                            .search(params[:q])
                                            .filter_by_status(params[:status])
                                            .order_default
                                            .result
                                            .includes(:publisher, :announcement_targets)
                                            .page(sanitized_page).per(sanitized_per_page)

          render json: {
            announcements: ActiveModelSerializers::SerializableResource.new(
              announcements, each_serializer: ::Admin::AnnouncementListSerializer
            ),
            meta: {
              current_page: announcements.current_page,
              total_pages: announcements.total_pages,
              total_count: announcements.total_count,
              per_page: announcements.limit_value
            }
          }
        end

        def show
          render json: { announcement: ::Admin::AnnouncementDetailSerializer.new(@announcement) }
        end

        def create
          form = ::Admin::AnnouncementForm.new(publisher: current_user, **announcement_params.to_h.symbolize_keys)

          if form.save
            render json: { message: 'お知らせを作成しました。' }, status: :created
          else
            render json: { errors: form.errors.full_messages }, status: :unprocessable_content
          end
        end

        def update
          authorize @announcement

          form = ::Admin::AnnouncementForm.new(announcement: @announcement, **announcement_params.to_h.symbolize_keys)

          if form.save
            render json: { message: 'お知らせを更新しました。' }, status: :ok
          else
            render json: { errors: form.errors.full_messages }, status: :unprocessable_content
          end
        end

        def destroy
          authorize @announcement

          @announcement.destroy!
          head :no_content
        end

        def publish
          authorize @announcement

          publisher = ::Admin::PublishAnnouncementService.new(@announcement)

          if publisher.call
            render json: { message: 'お知らせを配信しました。' }, status: :ok
          else
            render json: { errors: @announcement.errors.full_messages }, status: :unprocessable_content
          end
        end

        private

        def set_announcement
          @announcement = announcement_scope.find(params[:id])
        end

        def announcement_scope
          AnnouncementsQuery.new.result
        end

        def announcement_params
          params.require(:announcement).permit(:title, :content, :status, :scheduled_at)
        end
      end
    end
  end
end
