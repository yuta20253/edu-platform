# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class TeachersController < Api::V1::Teacher::BaseController
        def index
          teachers = teachers_query.order(:name_kana).page(params[:page]).per(20)

          render json: {
            teachers: ActiveModelSerializers::SerializableResource.new(
              teachers, each_serializer: TeacherSerializer
            ),
            meta: {
              current_page: teachers.current_page,
              total_pages: teachers.total_pages,
              total_count: teachers.total_count,
              per_page: 20
            }
          }, status: :ok
        end

        def show
          teacher = teachers_query.find(params[:id])
          render json: teacher, serializer: TeacherSerializer, status: :ok
        end

        private

        def teachers_query
          query = ::Teacher::TeachersQuery.new(current_user.high_school.users).colleagues
          query.result
        end
      end
    end
  end
end
