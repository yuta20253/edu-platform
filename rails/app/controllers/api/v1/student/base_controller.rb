# frozen_string_literal: true

module Api
  module V1
    module Student
      class BaseController < ApplicationController
        before_action :authorize_student_service

        private

        def authorize_student_service
          authorize :student_service, :access?
        end
      end
    end
  end
end
