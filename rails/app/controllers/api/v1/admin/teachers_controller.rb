# frozen_string_literal: true

module Api
  module V1
    module Admin
      class TeachersController < BaseController
        def index
          school = HighSchool.find(params.expect(:high_school_id))
          teachers = school.users.teachers.includes(:teacher_permission, :grades)

          render json: {
            teachers: ActiveModelSerializers::SerializableResource.new(
              teachers,
              each_serializer: ::Admin::TeacherSerializer
            )
          }
        end

        def create
          school = HighSchool.find(params.expect(:high_school_id))
          user = ::Admin::CreateTeacherService.new(school: school, attributes: create_params).call

          render json: { teacher: ::Admin::TeacherSerializer.new(user) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        rescue ArgumentError => e
          render json: { errors: [e.message] }, status: :unprocessable_content
        end

        def update
          school = HighSchool.find(params.expect(:high_school_id))
          user = school.users.teachers.find(params.expect(:id))
          require_lock_version!
          return if performed?

          user = ::Admin::UpdateTeacherService.new(user: user, params: update_params).call

          render json: { teacher: ::Admin::TeacherSerializer.new(user) }, status: :ok
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        rescue ArgumentError => e
          render json: { errors: [e.message] }, status: :unprocessable_content
        end

        private

        def create_params
          params.permit(:name, :email, :grade_scope, :manage_other_teachers, grade_ids: [])
                .to_h.symbolize_keys
        end

        def update_params
          params.permit(:name, :email, :grade_scope, :manage_other_teachers, :permission_lock_version, grade_ids: [])
        end

        def require_lock_version!
          return if params[:permission_lock_version].present?

          render json: { errors: ['lock_versionは必須です'] }, status: :unprocessable_content
        end
      end
    end
  end
end
