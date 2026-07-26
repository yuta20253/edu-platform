# frozen_string_literal: true

module Api
  module V1
    module Student
      class BaseController < ApplicationController
        before_action :authorize_student_service

        rescue_from ::Student::InvalidAnalyticsTypeError, with: :bad_request

        private

        def authorize_student_service
          authorize :student_service, :access?
        end

        def bad_request(exception)
          render json: { errors: exception.message }, status: :bad_request
        end
      end
    end
  end
end
