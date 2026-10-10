# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class StudentsController < Api::V1::Teacher::BaseController
        before_action :set_student, only: :show
        include TeacherStudentsScope

        DEFAULT_PER_PAGE = 10

        def index
          students = students_scope.page(sanitized_page).per(sanitized_per_page)
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
          case params[:tab]
          when 'goals'
            render json: {
              student: { id: @student.id, name: @student.name },
              goals: ActiveModelSerializers::SerializableResource.new(
                goals, each_serializer: ::Teacher::StudentGoalSerializer
              )
            }, status: :ok
          when 'tasks'
            task_progress = ::Common::TaskProgressService.new(user: @student, tasks: tasks).call

            render json: {
              student: { id: @student.id, name: @student.name },
              tasks: ActiveModelSerializers::SerializableResource.new(
                tasks, each_serializer: ::Teacher::StudentTaskSerializer, task_progress: task_progress
              ),
              meta: {
                current_page: tasks.current_page,
                total_pages: tasks.total_pages,
                total_count: tasks.total_count,
                per_page: tasks.limit_value
              }
            }, status: :ok
          else
            render json: @student, serializer: StudentSerializer, status: :ok
          end
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

        def create_student_params
          params.require(:user).permit(:name, :name_kana, :email, :grade_id, :school_class_id)
        end

        def goals
          GoalsQuery
            .new(@student.goals)
            .due_soon
            .includes_tasks
            .result
        end

        def tasks
          @tasks ||= TasksQuery
            .new(@student.tasks)
            .due_soon
            .includes_units
            .paginate(
              page: sanitized_page,
              per_page: sanitized_per_page
            )
            .result
        end

        def set_student
          @student = students_scope.find(params[:id])
        end
      end
    end
  end
end
