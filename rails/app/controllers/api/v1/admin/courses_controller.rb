# frozen_string_literal: true

module Api
  module V1
    module Admin
      class CoursesController < BaseController
        def show
          course = Course.includes(:subject, :units).find(params[:id])

          render json: course, serializer: ::Admin::CourseDetailSerializer
        end
      end
    end
  end
end
