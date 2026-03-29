# frozen_string_literal: true

module Api
  module V1
    class ProfilesController < ApplicationController
      def update
        ActiveRecord::Base.transaction do
          update_user!
          update_user_personal_info!
        end

        render json: {
          user: ActiveModelSerializers::SerializableResource.new(
            current_user,
            serializer: CurrentUserSerializer
          ), status: :ok
        }
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      private

      def update_user!
        current_user.update!(user_params)
      end

      def update_user_personal_info!
        info = current_user.user_personal_info || current_user.build_user_personal_info
        info.update!(personal_info_params)
      end

      def user_params
        params.permit(:address_id)
      end

      def personal_info_params
        params.permit(:phone_number, :birthday, :gender)
      end
    end
  end
end
