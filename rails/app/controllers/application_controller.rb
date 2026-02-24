# frozen_string_literal: true

class ApplicationController < ActionController::API
  include ActionController::MimeResponds
  include Devise::Controllers::Helpers
  include Pundit::Authorization

  before_action :authenticate_user!

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :not_found

  private

  def user_not_authorized(_exception)
    render json: { errors: 'この操作を行う権限がありません' }, status: :forbidden
  end

  def not_found(exception)
    model = exception.model.constantize
    render json: { message: "#{model.model_name.human}が見つかりません" }, status: :not_found
  end
end
