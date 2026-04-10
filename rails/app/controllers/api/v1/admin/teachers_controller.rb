# frozen_string_literal: true

module Api
  module V1
    module Admin
      class TeachersController < BaseController
        def index
          school = HighSchool.find(params[:high_school_id])
          teachers = school.users.teachers.includes(:teacher_permission, :grades)

          render json: {
            teachers: ActiveModelSerializers::SerializableResource.new(
              teachers,
              each_serializer: ::Admin::TeacherSerializer
            )
          }
        end
      end
    end
  end
end
