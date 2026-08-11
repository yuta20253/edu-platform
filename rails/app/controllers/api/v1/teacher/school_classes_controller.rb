# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class SchoolClassesController < Api::V1::Teacher::BaseController
        def index
          grades = current_user.high_school.grades.includes(:school_classes)

          render json: grades, each_serializer: ::Teacher::TeacherSchoolClassGradeSerializer, status: :ok
        end

        def show
          school_class = SchoolClass
                         .joins(:grade)
                         .find_by!(
                           id: params[:id],
                           grades: { high_school_id: current_user.high_school_id }
                         )

          render json: school_class, serializer: SchoolClassSerializer, status: :ok
        end

        def create
          result = ::Teacher::CreateSchoolClassRequestForm.new(
            user: current_user,
            **create_school_class_params.to_h.symbolize_keys
          )
        end

        private

        def create_school_class_params
          params.require(:school_class).permit(:name, :grade_id)
        end
      end
    end
  end
end
