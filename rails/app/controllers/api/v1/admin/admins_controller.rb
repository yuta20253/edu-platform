# frozen_string_literal: true

module Api
  module V1
    module Admin
      class AdminsController < BaseController
        DEFAULT_PER_PAGE = 25

        def index
          scope = AdminsQuery.new.search(params[:q]).order_default.result
          admins = scope.page(params[:page]).per(params[:per_page].presence || DEFAULT_PER_PAGE)

          render json: {
            admins: ActiveModelSerializers::SerializableResource.new(
              admins, each_serializer: ::Admin::AdminListSerializer
            ),
            meta: {
              page: admins.current_page,
              per_page: admins.limit_value,
              total_pages: admins.total_pages,
              total_count: admins.total_count
            }
          }
        end

        def show
          admin = User.admins.where(deleted_at: nil).find(params[:id])

          render json: { admin: ::Admin::AdminDetailSerializer.new(admin) }
        end

        def create
          form = ::Admin::AdminForm.new(create_params)
          admin = form.save!

          render json: { admin: ::Admin::AdminDetailSerializer.new(admin) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        def update
          head :ok
        end

        def destroy
          head :no_content
        end

        private

        def create_params
          params.permit(:name, :email)
        end
      end
    end
  end
end
