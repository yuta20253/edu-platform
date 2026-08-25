# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class BaseController < ApplicationController
        before_action :authorize_teacher_service

        rescue_from ActiveRecord::StaleObjectError, with: :stale_object
        rescue_from ::Teacher::ProcessSchoolClassRequestService::ApplicantCannotProcessOwnRequestError,
                    with: :applicant_cannot_process_own_request

        private

        def authorize_teacher_service
          authorize :teacher_service, :access?
        end

        def stale_object
          render json: { errors: ['他のユーザーによってデータが更新されています。再読み込みしてください'] }, status: :conflict
        end

        def applicant_cannot_process_own_request
          render json: { errors: ['自身の申請は承認・却下できません'] }, status: :forbidden
        end
      end
    end
  end
end
