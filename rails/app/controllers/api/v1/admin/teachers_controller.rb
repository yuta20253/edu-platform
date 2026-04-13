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

          if teacher_params[:name].blank?
            return render json: { errors: ['名前を入力してください'] }, status: :unprocessable_content
          end

          ActiveRecord::Base.transaction do
            teacher_role = UserRole.find_or_create_by!(name: :teacher)
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
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        def update
          school = HighSchool.find(params[:high_school_id])
          user = school.users.teachers.find(params[:id])

          if teacher_params[:password].present? && teacher_params[:password_confirmation].blank?
            return render json: { errors: ['パスワード確認を入力してください'] }, status: :unprocessable_content
          end

          ActiveRecord::Base.transaction do
            update_user_attributes(user)
            update_permission_attributes(user)
            update_teacher_grades(user)

            user.reload
            render json: { teacher: ::Admin::TeacherSerializer.new(user) }, status: :ok
          end
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        private

        def update_user_attributes(user)
          user_attrs = teacher_params.slice(:name, :email).compact
          if teacher_params[:password].present?
            user_attrs[:password] = teacher_params[:password]
            user_attrs[:password_confirmation] = teacher_params[:password_confirmation]
          end
          user.update!(user_attrs) if user_attrs.present?
        end

        def update_permission_attributes(user)
          permission_attrs = teacher_params.slice(:grade_scope, :manage_other_teachers).compact
          user.teacher_permission.update!(permission_attrs) if permission_attrs.present?
        end

        def update_teacher_grades(user)
          return unless teacher_params.key?(:grade_ids)

          user.teacher_grades.destroy_all
          teacher_params[:grade_ids].each { |grade_id| user.teacher_grades.create!(grade_id: grade_id) }
        end

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
