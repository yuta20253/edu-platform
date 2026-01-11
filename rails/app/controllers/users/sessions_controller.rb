# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  include RackSessionFix
  # before_action :configure_sign_in_params, only: [:create]

  # POST /resource/sign_in
  def create
    super do |user|
      return render json: { token: request.env['warden-jwt_auth.token'], user: user } if request.format.json?
    end
  end

  # DELETE /resource/sign_out
  # def destroy
  #   super
  # end

  # protected

  # If you have extra params to permit, append them to the sanitizer.
  # def configure_sign_in_params
  #   devise_parameter_sanitizer.permit(:sign_in, keys: [:attribute])
  # end
end
