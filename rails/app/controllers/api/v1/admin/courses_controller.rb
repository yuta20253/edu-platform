# frozen_string_literal: true

module Api
  module V1
    module Admin
      class CoursesController < BaseController
        DEFAULT_PER_PAGE = 20

        def index
          courses = ::Admin::CoursesQuery.new
                                         .active
                                         .order_by(params[:sort], params[:order])
                                         .result
                                         .page(params[:page]).per(DEFAULT_PER_PAGE)

          render json: {
            courses: ActiveModelSerializers::SerializableResource.new(
              courses,
              each_serializer: ::Admin::CourseListSerializer,
              units_counts: {},
              questions_counts: {}
            ),
            meta: {
              current_page: courses.current_page,
              total_pages: courses.total_pages,
              total_count: courses.total_count,
              per_page: DEFAULT_PER_PAGE
            }
          }
        end

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
