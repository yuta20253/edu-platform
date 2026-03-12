# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class StudentsController < Api::V1::Teacher::BaseController
        def index
          students = students_scope
          render json: students, each_serializer: StudentSerializer, status: :ok
        end

        def show
          student = students_scope.find(params[:id])
          render json: student, serializer: StudentSerializer, status: :ok
        end

        private

        def students_scope
          query = ::Teacher::StudentsQuery.new(current_user.high_school.users).students
          query = query.my_grade(current_user.grade_id) if current_user.teacher_permission.own_grade?
          query.result
        end
      end
    end
  end
end
