# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class BaseController < ApplicationController
        before_action :authorize_teacher_service

        rescue_from ActiveRecord::StaleObjectError, with: :stale_object

        private

        def authorize_teacher_service
          authorize :teacher_service, :access?
        end

        def stale_object
          render json: { errors: ['他のユーザーによってデータが更新されています。再読み込みしてください'] }, status: :conflict
        end
      end
    end
  end
end
