# frozen_string_literal: true

module Api
  module V1
    class SessionsController < Devise::SessionsController
      before_action :authenticate_user!, only: [:destroy]
      respond_to :json
      def create
        request.env['devise.mapping'] = Devise.mappings[:user]
        form = Auth::LoginForm.new(email: params[:email], password: params[:password])

        return render json: { errors: form.errors.full_messages }, status: :unprocessable_content if form.invalid?

        user = Auth::LoginService.new(form).call

        sign_in(user, store: false)

        render json: { user: user }, status: :ok
      rescue Auth::LoginService::LoginError => e
        render json: { errors: [e.message] }, status: :unauthorized
      rescue ActiveRecord::RecordNotFound => e
        render json: { errors: ["指定されたユーザーが見つかりません: #{e.model}"] }, status: :not_found
      end

      def destroy
        current_user.update!(jti: SecureRandom.uuid)

        render json: { message: "ログアウトしました。" }, status: :ok
      end
    end
  end
end
