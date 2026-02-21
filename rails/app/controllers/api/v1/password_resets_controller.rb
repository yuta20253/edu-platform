# frozen_string_literal: true

module Api
  module V1
    class PasswordResetsController < ApplicationController
      skip_before_action :authenticate_user!, only: %i[create update]

      def create
        user = User.find_by(email: params[:email])
        Auth::ResetPasswordService.new(user).call

        render json: { message: 'パスワード変更メールを送信しました。' }, status: :ok
      rescue StandardError => e
        Rails.logger.error "[PasswordReset] Failed for user_id: #{user&.id} error: #{e.class} message: #{e.message}"
        render json: { message: 'パスワード変更メールを送信しました。' }, status: :ok
      end

      def update
        form = Auth::PasswordResetForm.new(password_reset_params)
        message = Auth::ChangePasswordService.new(form).call

        render json: { message: message }, status: :ok
      rescue ValidationError => e
        render json: { errors: e.errors }, status: :unprocessable_content
      end

      private

      def password_reset_params
        params.permit(:reset_password_token, :password, :password_confirmation)
      end
    end
  end
end
