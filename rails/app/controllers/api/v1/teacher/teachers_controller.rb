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

        def create
          return render json: { errors: '他職員操作権限がありません' } unless current_user.teacher_permission.manage_other_teachers

          form = ::Teacher::CreateTeacherForm.new(current_user: current_user,
                                                  **create_teacher_params.to_h.symbolize_keys)

          if form.save
            render json: { message: '教員の新規作成に成功しました。' }, status: :created
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        private

        def create_teacher_params
          params.permit(:name, :name_kana, :email, :grade_id, :grade_scope, :manage_other_teachers)
        end

        def teachers_query
          query = ::Teacher::TeachersQuery.new(current_user.high_school.users).colleagues
          query.result
        end
      end
    end
  end
end
