# frozen_string_literal: true

module Api
  module V1
    module Admin
      class GradesController < BaseController
        def index
          school = HighSchool.find(params[:high_school_id])
          grades = school.grades.order(:year)

          render json: {
            grades: ActiveModelSerializers::SerializableResource.new(
              grades,
              each_serializer: ::Admin::GradeSerializer
            )
          }
        end
      end
    end
  end
end
