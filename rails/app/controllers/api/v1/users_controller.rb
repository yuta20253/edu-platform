# frozen_string_literal: true

module Api
  module V1
    class UsersController < ApplicationController
      def show
        render json: current_user, serializer: CurrentUserSerializer
      end
    end
  end
end
