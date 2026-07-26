# frozen_string_literal: true

class ApplicationController < ActionController::API
  include ActionController::MimeResponds
  include Devise::Controllers::Helpers
  include Pundit::Authorization

  include ActionController::Cookies

  before_action :authenticate_user!

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :not_found

  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  private

  def user_not_authorized(_exception)
    render json: { errors: 'この操作を行う権限がありません' }, status: :forbidden
  end

  def not_found(exception)
    model = exception.model.safe_constantize
    render json: { message: "#{model.model_name.human}が見つかりません" }, status: :not_found
  end

  def sanitized_per_page
    value = params[:per_page]
    return self.class::DEFAULT_PER_PAGE unless value.is_a?(String) || value.is_a?(Integer)

    raw = value.to_i
    return self.class::DEFAULT_PER_PAGE if raw <= 0

    [raw, MAX_PER_PAGE].min
  end

  def sanitized_page
    value = params[:page]
    return nil unless value.is_a?(String) || value.is_a?(Integer)

    raw = value.to_i
    return nil if raw <= 0

    raw
  end
end
