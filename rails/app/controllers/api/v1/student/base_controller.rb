# frozen_string_literal: true

module Api
  module V1
    module Student
      class BaseController < ApplicationController
        before_action :authorize_student_service

        rescue_from ::Student::InvalidAnalyticsTypeError, with: :bad_request
        rescue_from ::Student::AlreadyCompletedStudyLogError, with: :bad_request
        rescue_from ActiveRecord::StaleObjectError, with: :stale_object
        rescue_from ::Student::AccountLinkService::AlreadyLinkedError, with: :bad_request
        rescue_from ::Student::AccountLinkService::AlreadyActivatedError, with: :bad_request
        rescue_from ::Student::AccountLinkService::HasDependentDataError, with: :bad_request
        rescue_from ::Student::AccountLinkService::InvalidFormatError, with: :bad_request
        rescue_from ::Student::AccountLinkService::SchoolMismatchError, with: :bad_request

        private

        def authorize_student_service
          authorize :student_service, :access?
        end

        def bad_request(exception)
          render json: { errors: [exception.message] }, status: :bad_request
        end

        def stale_object
          render json: { errors: ['他のユーザーによってデータが更新されています。再読み込みしてください'] }, status: :conflict
        end
      end
    end
  end
end
