# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class StudentsController < Api::V1::Teacher::BaseController
        def index
          students = students_query.page(params[:page]).per(20)
          render json: {
            students: ActiveModelSerializers::SerializableResource.new(
              students, each_serializer: StudentSerializer
            ),
            meta: {
              current_page: students.current_page,
              total_pages: students.total_pages,
              total_count: students.total_count,
              per_page: 20
            }
          }, status: :ok
        end

        def show
          student = students_query.find(params[:id])
          render json: student, serializer: StudentSerializer, status: :ok
        end

        private

        def students_query
          ::Teacher::StudentsQuery.new(current_user.high_school.users).call(grade_id: filter_grade_id)
        end

        def filter_grade_id
          return nil unless current_user.teacher_permission.own_grade?

          current_user.grade_id
        end
      end
    end
  end
end
