# frozen_string_literal: true

module Api
  module V1
    module Admin
      class BaseController < ApplicationController
        before_action :authorize_admin_service

        rescue_from Csv::Errors::InvalidFileType do |e|
          render json: { errors: [e.message] }, status: :unprocessable_content
        end

        rescue_from Csv::Errors::InvalidHeader do |e|
          render json: { errors: [e.message] }, status: :unprocessable_content
        end

        private

        def authorize_admin_service
          authorize :admin_service, :access?
        end

        def pagination_meta(collection)
          {
            current_page: collection.current_page,
            total_pages: collection.total_pages,
            total_count: collection.total_count,
            per_page: collection.limit_value
          }
        end
      end
    end
  end
end
