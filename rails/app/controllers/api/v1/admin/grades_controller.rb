# frozen_string_literal: true

module Api
  module V1
    module Admin
      class GradesController < BaseController
        def index
          school = HighSchool.find(params[:high_school_id])
          per_page = sanitized_per_page
          grades = school.grades.order(:year).page(sanitized_page).per(per_page)

          render json: {
            grades: ActiveModelSerializers::SerializableResource.new(
              grades,
              each_serializer: ::Admin::GradeSerializer
            ),
            meta: {
              current_page: grades.current_page,
              total_pages: grades.total_pages,
              total_count: grades.total_count,
              per_page: per_page
            }
          }
        end
      end
    end
  end
end
