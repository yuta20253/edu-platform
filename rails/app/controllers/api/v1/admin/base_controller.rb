# frozen_string_literal: true

module Api
  module V1
    module Admin
      class BaseController < ApplicationController
        DEFAULT_PER_PAGE = 20
        MAX_PER_PAGE = 100

        before_action :authorize_admin_service

        rescue_from Csv::Errors::InvalidFileType do |e|
          render json: { error: e.message }, status: :unprocessable_content
        end

        private

        def authorize_admin_service
          authorize :admin_service, :access?
        end

        def sanitized_per_page
          value = params[:per_page]
          return DEFAULT_PER_PAGE unless value.is_a?(String) || value.is_a?(Integer)

          raw = value.to_i
          return DEFAULT_PER_PAGE if raw <= 0

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
    end
  end
end
