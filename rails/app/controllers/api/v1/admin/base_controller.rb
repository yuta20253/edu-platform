# frozen_string_literal: true

module Api
  module V1
    module Admin
      class BaseController < ApplicationController
        before_action :authorize_admin_service

        private

        def authorize_admin_service
          authorize :admin_service, :access?
        end
      end
    end
  end
end
