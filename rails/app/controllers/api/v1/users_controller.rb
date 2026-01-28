class Api::V1::UsersController < ApplicationController
  def show
    render json: current_user, serializer: CurrentUserSerializer
  end
end
