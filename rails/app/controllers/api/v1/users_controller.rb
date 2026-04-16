# frozen_string_literal: true

module Api
  module V1
    class UsersController < ApplicationController
      def show
        user = User
               .includes(
                 :user_personal_info,
                 :user_role,
                 :high_school,
                 address: :prefecture,
               )
               .find(current_user.id)

        render json: {
          user: ActiveModelSerializers::SerializableResource.new(
            user,
            serializer: CurrentUserSerializer
          )
        }
      end
    end
  end
end
