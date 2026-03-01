# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class TeachersController < Api::V1::Teacher::BaseController
        def index
          teachers = TeachersQuery.new(current_user.high_school.users).colleagues.result
          render json: teachers, each_serializer: TeacherSerializer, status: :ok
        end

        def show
          teacher = TeachersQuery.new(current_user.high_school.users).colleagues.find(params[:id])
          render json: teacher, serializer: TeacherSerializer, status: :ok
        end
      end
    end
  end
end
