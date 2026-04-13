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

        def create
          school = HighSchool.find(params[:high_school_id])
          user = ::Admin::CreateTeacherService.new(
            school: school,
            name: teacher_params[:name],
            email: teacher_params[:email]
          ).call
          render json: { teacher: ::Admin::TeacherSerializer.new(user) }, status: :created
        rescue ::Admin::CreateTeacherService::ValidationError => e
          render json: { errors: [e.message] }, status: :unprocessable_content
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        def update
          school = HighSchool.find(params[:high_school_id])
          user = school.users.teachers.find(params[:id])
          user = ::Admin::UpdateTeacherService.new(user: user, params: teacher_params).call
          render json: { teacher: ::Admin::TeacherSerializer.new(user) }, status: :ok
        rescue ::Admin::UpdateTeacherService::ValidationError => e
          render json: { errors: [e.message] }, status: :unprocessable_content
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        private

        def teacher_params
          params.permit(
            :name, :email, :password, :password_confirmation,
            :grade_scope, :manage_other_teachers, grade_ids: []
          )
        end
      end
    end
  end
end
