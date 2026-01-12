# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < ApplicationController
      def create
        form = Auth::SignUpForm.new(sign_up_params)

        unless form.valid?
          return render json: { errors: form.errors.full_messages }, status: :unprocessable_entity
        end

        user, token = Auth::SignUpService.new(form).call

        render json: { user: user, token: token }, status: :created
      rescue ActiveRecord::RecordNotFound => e
        render json: { errors: ["指定された情報が見つかりません: #{e.model}"] }, status: :not_found
      rescue SignUpService::JWTGenerationError => e
        render json: { errors: ["トークン生成に失敗しました"] }, status: :internal_server_error
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      rescue StandardError => e
        render json: { errors: ["予期せぬエラーが発生しました: #{e.message}"] }, status: :internal_server_error
      end

      private

      def sign_up_params
        params.require(:user).permit(:email, :name, :name_kana, :password, :password_confirmation, :role_name, :school_name)
      end
    end
  end
end
