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
      end
    end
  end
end
