# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class TeachersController < Api::V1::Teacher::BaseController
        def index
          teachers = teachers_query
          render json: teachers, each_serializer: TeacherSerializer, status: :ok
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
