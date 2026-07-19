# frozen_string_literal: true

module Api
  module V1
    module Student
      class AnalyticsController < Api::V1::Student::BaseController
        def index
          analytics = ::Student::AnalyticsService.new(
            user: current_user,
            type: analytics_type,
            course_id: params[:course_id],
            unit_id: params[:unit_id]
          ).call
          render json: analytics, status: :ok
        end

        private

        def analytics_type
          params.require(:analytics).permit(:type)[:type]
        end
      end
    end
  end
end
