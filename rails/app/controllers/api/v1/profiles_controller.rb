# frozen_string_literal: true

module Api
  module V1
    class ProfilesController < ApplicationController
      def update
        form = ProfileUpdateForm.new(profile_params.merge(user: current_user))

        if form.save
          render json: {
            user: ActiveModelSerializers::SerializableResource.new(
              current_user,
              serializer: CurrentUserSerializer
            )
          }, status: :ok
        else
          render json: { errors: form.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def profile_params
        params.permit(:name, :name_kana, :address_id, :birthday, :gender, :phone_number)
      end
    end
  end
end
