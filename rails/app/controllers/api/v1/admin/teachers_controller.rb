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

          ActiveRecord::Base.transaction do
            teacher_role = UserRole.find_by!(name: 'teacher')
            password = SecureRandom.hex(16)
            user = User.create!(
              name: teacher_params[:name],
              email: teacher_params[:email],
              password: password,
              password_confirmation: password,
              user_role: teacher_role,
              high_school: school
            )
            user.create_teacher_permission!(grade_scope: :own_grade, manage_other_teachers: false)
            user.send_reset_password_instructions

            user.reload
            render json: { teacher: ::Admin::TeacherSerializer.new(user) }, status: :created
          end
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def update
          school = HighSchool.find(params[:high_school_id])
          user = school.users.teachers.find(params[:id])

          ActiveRecord::Base.transaction do
            user_attrs = teacher_params.slice(:name, :email).compact

            if teacher_params[:password].present?
              user_attrs[:password] = teacher_params[:password]
              user_attrs[:password_confirmation] = teacher_params[:password_confirmation]
            end

            user.update!(user_attrs) if user_attrs.present?

            permission_attrs = teacher_params.slice(:grade_scope, :manage_other_teachers).compact
            user.teacher_permission.update!(permission_attrs) if permission_attrs.present?

            if teacher_params.key?(:grade_ids)
              user.teacher_grades.destroy_all
              teacher_params[:grade_ids].each { |grade_id| user.teacher_grades.create!(grade_id: grade_id) }
            end

            user.reload
            render json: { teacher: ::Admin::TeacherSerializer.new(user) }, status: :ok
          end
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        private

        def teacher_params
          params.require(:teacher).permit(
            :name, :email, :password, :password_confirmation,
            :grade_scope, :manage_other_teachers, grade_ids: []
          )
        end
      end
    end
  end
end
