# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < ApplicationController
      skip_before_action :authenticate_user!, only: [:create]
      def create
        form = Auth::SignUpForm.new(sign_up_params)

        return render json: { errors: form.errors.full_messages }, status: :unprocessable_content unless form.valid?

        user = Auth::SignUpService.new(form).call

        render json: { user: user }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ['指定された情報が見つかりません'] }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      rescue StandardError
        render json: { errors: ['予期せぬエラーが発生しました'] }, status: :internal_server_error
      end

      private

      def sign_up_params
        params.require(:user).permit(:email, :name, :name_kana, :password, :password_confirmation, :user_role_name,
                                     :school_name)
      end
    end
  end
end
