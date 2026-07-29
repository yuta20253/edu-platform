# frozen_string_literal: true

module Api
  module V1
    module Admin
      class AdminsController < BaseController
        DEFAULT_PER_PAGE = 25

        def index
          scope = AdminsQuery.new.search(params[:q]).order_default.result
          admins = scope.page(sanitized_page).per(sanitized_per_page)

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
          admin = admin_scope.find(params[:id])

          render json: { admin: ::Admin::AdminDetailSerializer.new(admin) }
        end

        def create
          form = ::Admin::AdminForm.new(create_params)

          if form.save
            render json: { admin: ::Admin::AdminDetailSerializer.new(form.result) }, status: :created
          else
            render json: { errors: form.errors.full_messages }, status: :unprocessable_content
          end
        end

        def update
          admin = admin_scope.find(params[:id])
          form = ::Admin::AdminForm.new(update_params.merge(user: admin))

          if form.save
            render json: { admin: ::Admin::AdminDetailSerializer.new(form.result) }, status: :ok
          else
            render json: { errors: form.errors.full_messages }, status: :unprocessable_content
          end
        end

        def destroy
          target = User.admins.active.find(params[:id])

          return render_delete_error('最後の管理者は削除できません') if last_active_admin?(target)
          return render_delete_error('自分自身は削除できません') if target == current_user

          # 論理削除は内部的な状態変更のため、name_kana など on: :update の
          # presence バリデーション（プロフィール未設定の招待直後 admin で失敗する）を
          # 走らせずに deleted_at だけ更新する。
          now = Time.current
          target.update_columns(deleted_at: now, updated_at: now)
          head :no_content
        end

        private

        # show / update で個人情報・住所まで返すため eager load して N+1 を避ける
        def admin_scope
          User.admins.active.includes(:user_personal_info, address: :prefecture)
        end

        def create_params
          params.permit(:name, :email)
        end

        def update_params
          params.permit(:name, :name_kana, :email, :address_id, :phone_number, :birthday, :gender)
        end

        def last_active_admin?(target)
          !User.admins.active.where.not(id: target.id).exists?
        end

        def render_delete_error(message)
          render json: { errors: [message] }, status: :unprocessable_content
        end
      end
    end
  end
end
