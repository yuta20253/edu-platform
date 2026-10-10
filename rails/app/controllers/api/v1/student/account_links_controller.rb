# frozen_string_literal: true

module Api
  module V1
    module Student
      class AccountLinksController < Api::V1::Student::BaseController
        # 生徒コードの存在有無を区別できてしまうと、総当たりで他人の生徒コードの
        # 使用状況を探られる恐れがあるため、「見つからない」と「既に使用済み」を
        # 区別しない1つのメッセージにまとめる。
        rescue_from ActiveRecord::RecordNotFound, with: :account_link_not_found

        def create
          ::Student::AccountLinkService.new(user: current_user, student_number: params[:student_number]).call

          render json: { message: 'アカウントの紐付けが成功しました' }, status: :ok
        end

        def preview
          result = ::Student::AccountLinkPreviewService.new(
            user: current_user, student_number: params[:student_number]
          ).call

          render json: result, status: :ok
        end

        private

        def account_link_not_found(_exception)
          render json: {
            errors: ['見つからないか、すでに使用されています。心当たりがある場合は学校へお問い合わせください']
          }, status: :not_found
        end
      end
    end
  end
end
