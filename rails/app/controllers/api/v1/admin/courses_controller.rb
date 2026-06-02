# frozen_string_literal: true

module Api
  module V1
    module Admin
      class CoursesController < BaseController
        DEFAULT_PER_PAGE = 20
        MAX_PER_PAGE = 100

        def index
          per_page = sanitized_per_page
          courses = ::Admin::CoursesQuery.new
                                         .active
                                         .by_subject_id(params[:subject_id])
                                         .search(params[:q])
                                         .order_by(params[:sort], params[:order])
                                         .result
                                         .includes(:subject)
                                         .page(params[:page]).per(per_page)

          course_ids = courses.pluck(:id)
          units_counts = Unit.where(course_id: course_ids, deleted_at: nil).group(:course_id).count
          questions_counts = Question.joins(:unit)
                                     .where(units: { course_id: course_ids, deleted_at: nil })
                                     .where(deleted_at: nil)
                                     .group('units.course_id').count

          render json: {
            courses: ActiveModelSerializers::SerializableResource.new(
              courses,
              each_serializer: ::Admin::CourseListSerializer,
              units_counts: units_counts,
              questions_counts: questions_counts
            ),
            meta: {
              current_page: courses.current_page,
              total_pages: courses.total_pages,
              total_count: courses.total_count,
              per_page: per_page
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

        private

        def sanitized_per_page
          raw = params[:per_page].to_i
          return DEFAULT_PER_PAGE if raw <= 0

          [raw, MAX_PER_PAGE].min
        end
      end
    end
  end
end
