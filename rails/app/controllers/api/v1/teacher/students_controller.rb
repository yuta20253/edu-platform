# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class StudentsController < Api::V1::Teacher::BaseController
        def index
          if current_user.teacher_permission.own_grade?
            students = current_user.high_school.users.where(user_role: 2).where(grade_id: current_user.grade_id)
            render json: students, status: :ok
          else
            students = current_user.high_school.users.where(user_role: 2)
            render json: students, status: :ok
          end
        end
      end
    end
  end
end
