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
              current_page: admins.current_page,
              total_pages: admins.total_pages,
              total_count: admins.total_count,
              per_page: admins.limit_value
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
          admin = User.admins.where(deleted_at: nil).find(params[:id])
          form = ::Admin::AdminForm.new(update_params.merge(user: admin))
          updated = form.save!

          render json: { admin: ::Admin::AdminDetailSerializer.new(updated) }, status: :ok
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        def destroy
          target = User.admins.where(deleted_at: nil).find(params[:id])

          if last_active_admin?(target)
            return render json: { errors: ['最後の管理者は削除できません'] },
                          status: :unprocessable_content
          end

          if target == current_user
            return render json: { errors: ['自分自身は削除できません'] },
                          status: :unprocessable_content
          end

          target.update!(deleted_at: Time.current)
          head :no_content
        end

        private

        def create_params
          params.permit(:name, :email)
        end

        def update_params
          params.permit(:name, :email)
        end

        def last_active_admin?(target)
          !User.admins.where(deleted_at: nil).where.not(id: target.id).exists?
        end
      end
    end
  end
end
