# frozen_string_literal: true

module Api
  module V1
    class PasswordResetsController < ApplicationController
      skip_before_action :authenticate_user!, only: %i[create update verify]
      wrap_parameters false
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

      def verify
        Rails.logger.debug params.inspect
        user = User.with_reset_password_token(params[:reset_password_token])

        Rails.logger.debug user.inspect
        return render_user_not_found unless user
        return render_expired_token unless user.reset_password_period_valid?

        render json: { message: 'トークンは有効です。' }, status: :ok
      end

      private

      def password_reset_params
        params.require(:password_reset).permit(:reset_password_token, :password, :password_confirmation)
      end

      def render_user_not_found
        render json: { errors: ['ユーザーが見つかりません。'] }, status: :not_found
      end

      def render_expired_token
        render json: { errors: ['トークンの有効期限が切れています。'] }, status: :unauthorized
      end
    end
  end
end
