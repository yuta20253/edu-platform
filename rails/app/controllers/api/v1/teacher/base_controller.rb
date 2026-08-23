# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class BaseController < ApplicationController
        before_action :authorize_teacher_service

        rescue_from Csv::Errors::InvalidFileType do |e|
          render json: { errors: [e.message] }, status: :unprocessable_content
        end

        private

        def authorize_teacher_service
          authorize :teacher_service, :access?
        end
      end
    end
  end
end
