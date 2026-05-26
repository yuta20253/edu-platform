# frozen_string_literal: true

module Api
  module V1
    module Admin
      class CoursesController < BaseController
        def show
          course = Course.includes(:subject, :units).find(params[:id])
          questions_counts = Question.where(unit_id: course.unit_ids).group(:unit_id).count

          render json: course,
                 serializer: ::Admin::CourseDetailSerializer,
                 questions_counts: questions_counts
        end
      end
    end
  end
end
