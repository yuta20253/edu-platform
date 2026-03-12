# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class BaseController < ApplicationController
        before_action :authorize_teacher_service

        private

        def authorize_teacher_service
          authorize :teacher_service, :access?
        end
      end
    end
  end
end
