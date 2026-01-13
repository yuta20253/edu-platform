# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < ApplicationController
      def create
        form = Auth::SignUpForm.new(sign_up_params)

        return render json: { errors: form.errors.full_messages }, status: :unprocessable_content unless form.valid?

        user = Auth::SignUpService.new(form).call

        sign_in(user, store: false)

        render json: { user: user }, status: :created
      rescue ActiveRecord::RecordNotFound => e
        render json: { errors: ["指定された情報が見つかりません: #{e.model}"] }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      rescue StandardError => e
        render json: { errors: ["予期せぬエラーが発生しました: #{e.message}"] }, status: :internal_server_error
      end

      private

      def sign_up_params
        params.require(:user).permit(:email, :name, :name_kana, :password, :password_confirmation, :role_name,
                                     :school_name)
      end
    end
  end
end
