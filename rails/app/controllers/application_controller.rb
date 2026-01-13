# frozen_string_literal: true

class ApplicationController < ActionController::API
  include ActionController::MimeResponds

  before_action :configure_permitted_parameters, if: :registrations_controller?

  protected

  def registrations_controller?
    self.class.name.start_with?('Api::V1::RegistrationsController')
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up,
                                      keys: %i[email password password_confirmation name name_kana user_role_id
                                               high_school_id])
    devise_parameter_sanitizer.permit(:account_update, keys: %i[password password_confirmation])
  end
end
