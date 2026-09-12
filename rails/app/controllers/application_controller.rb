# frozen_string_literal: true

class ApplicationController < ActionController::API
  include ActionController::MimeResponds
  include Devise::Controllers::Helpers
  include Pundit::Authorization

  include ActionController::Cookies

  before_action :authenticate_user!

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from ActiveRecord::StaleObjectError, with: :stale_object

  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  private

  def user_not_authorized(_exception)
    render json: { errors: ['この操作を行う権限がありません'] }, status: :forbidden
  end

  def not_found(exception)
    model = exception.model.safe_constantize
    render json: { message: "#{model.model_name.human}が見つかりません" }, status: :not_found
  end

  def record_invalid(exception)
    render json: { errors: exception.record.errors.full_messages }, status: :unprocessable_content
  end

  def stale_object
    render json: { errors: ['他のユーザーによってデータが更新されています。再読み込みしてください'] }, status: :conflict
  end

  def sanitized_per_page
    value = params[:per_page]
    return self.class::DEFAULT_PER_PAGE unless value.is_a?(String) || value.is_a?(Integer)

    raw = value.to_i
    return self.class::DEFAULT_PER_PAGE if raw <= 0

    [raw, self.class::MAX_PER_PAGE].min
  end

  def sanitized_page
    value = params[:page]
    return nil unless value.is_a?(String) || value.is_a?(Integer)

    raw = value.to_i
    return nil if raw <= 0

    raw
  end
end
