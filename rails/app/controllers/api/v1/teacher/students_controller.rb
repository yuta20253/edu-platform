# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class StudentsController < Api::V1::Teacher::BaseController
        include TeacherStudentsScope

        before_action :set_student, only: :show

        DEFAULT_PER_PAGE = 10

        def index
          students = students_scope.page(sanitized_page).per(sanitized_per_page)
          render json: {
            students: ActiveModelSerializers::SerializableResource.new(
              students, each_serializer: StudentSerializer
            ),
            meta: pagination_meta(students)
          }, status: :ok
        end

        def show
          case params[:tab]
          when 'goals' then render_goals
          when 'tasks' then render_tasks
          else render json: @student, serializer: StudentSerializer, status: :ok
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

        def render_goals
          render json: {
            student: student_summary,
            goals: ActiveModelSerializers::SerializableResource.new(
              student_goals, each_serializer: ::Teacher::StudentGoalSerializer
            )
          }, status: :ok
        end

        def render_tasks
          tasks = student_tasks
          task_progress = ::Common::TaskProgressService.new(user: @student, tasks: tasks).call

          render json: {
            student: student_summary,
            tasks: ActiveModelSerializers::SerializableResource.new(
              tasks, each_serializer: ::Teacher::StudentTaskSerializer, task_progress: task_progress
            ),
            meta: pagination_meta(tasks)
          }, status: :ok
        end

        def student_summary
          { id: @student.id, name: @student.name }
        end

        def student_goals
          GoalsQuery.new(@student.goals).due_soon.includes_tasks.result
        end

        def student_tasks
          TasksQuery.new(@student.tasks)
                    .due_soon
                    .includes_units
                    .paginate(page: sanitized_page, per_page: sanitized_per_page)
                    .result
        end

        def pagination_meta(collection)
          {
            current_page: collection.current_page,
            total_pages: collection.total_pages,
            total_count: collection.total_count,
            per_page: collection.limit_value
          }
        end

        def set_student
          @student = students_scope.find(params[:id])
        end
      end
    end
  end
end
