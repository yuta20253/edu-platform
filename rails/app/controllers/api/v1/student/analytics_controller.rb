# frozen_string_literal: true

module Api
  module V1
    module Student
      class AnalyticsController < Api::V1::Student::BaseController
        def index
          data = ::Student::AnalyticsService.new(
            user: current_user,
            type: analytics_type_params,
            course_id: params[:course_id],
          ).call
          render json: data, status: :ok
        end

        private

        def analytics_type_params
          params.require(:analytics).permit(:type)
        end
      end
    end
  end
end
