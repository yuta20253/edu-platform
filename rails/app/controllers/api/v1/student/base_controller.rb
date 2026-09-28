# frozen_string_literal: true

module Api
  module V1
    module Student
      class BaseController < ApplicationController
        before_action :authorize_student_service

        rescue_from ::Student::InvalidAnalyticsTypeError, with: :bad_request
        rescue_from ::Student::AlreadyCompletedStudyLogError, with: :bad_request
        rescue_from ::Student::AccountLinkService::AlreadyLinkedError, with: :bad_request
        rescue_from ::Student::AccountLinkService::AlreadyActivatedError, with: :bad_request
        rescue_from ::Student::AccountLinkService::HasDependentDataError, with: :bad_request
        rescue_from ::Student::AccountLinkService::InvalidFormatError, with: :bad_request
        rescue_from ::Student::AccountLinkService::SchoolMismatchError, with: :bad_request
        rescue_from ::Goal::HasActiveTasksError, with: :unprocessable_entity_error

        private

        def authorize_student_service
          authorize :student_service, :access?
        end

        def bad_request(exception)
          render json: { errors: [exception.message] }, status: :bad_request
        end

        def unprocessable_entity_error(exception)
          render json: { errors: [exception.message] }, status: :unprocessable_content
        end
      end
    end
  end
end
