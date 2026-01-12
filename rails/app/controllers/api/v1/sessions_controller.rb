# frozen_string_literal: true

module Api
  module V1
    class SessionsController < ApplicationController
      def create
        form = Auth::LoginForm.new(login_params)

        return render json: { errors: form.errors.full_messages }, status: :unprocessable_content if form.invalid?

        user, token = Auth::LoginService.new(form).call

        render json: { user: user, token: token }, status: :ok
      rescue Auth::LoginService::LoginError => e
        render json: { errors: [e.message] }, status: :unauthorized
      rescue ActiveRecord::RecordNotFound => e
        render json: { errors: ["指定されたユーザーが見つかりません: #{e.model}"] }, status: :not_found
      end

      private

      def login_params
        params.require(:user).permit(:email, :password)
      end
    end
  end
end
