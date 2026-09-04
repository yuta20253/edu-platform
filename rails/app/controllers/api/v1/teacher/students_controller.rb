# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class StudentsController < Api::V1::Teacher::BaseController
        DEFAULT_PER_PAGE = 10
        def index
          students = students_query.order(:name_kana).page(sanitized_page).per(sanitized_per_page)
          render json: {
            students: ActiveModelSerializers::SerializableResource.new(
              students, each_serializer: StudentSerializer
            ),
            meta: {
              current_page: students.current_page,
              total_pages: students.total_pages,
              total_count: students.total_count,
              per_page: students.limit_value
            }
          }, status: :ok
        end

        def show
          student = students_query.find(params[:id])
          render json: student, serializer: StudentSerializer, status: :ok
        end

        def create
          form = ::Teacher::CreateStudentForm.new(
            current_user: current_user, **create_student_params.to_h.symbolize_keys
          )

          if form.save
            render json: { message: '生徒の新規作成に成功しました。' }, status: :created
          else
            render json: { errors: form.errors.full_messages }, status: :unprocessable_content
          end
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        private

        def students_query
          ::Teacher::StudentsQuery.new(current_user.high_school.users).call(grade_id: filter_grade_id)
        end

        def filter_grade_id
          return nil unless current_user.teacher_permission.own_grade?

          current_user.grade_id
        end

        def create_student_params
          params.require(:user).permit(:name, :name_kana, :email, :grade_id, :school_class_id)
        end
      end
    end
  end
end
