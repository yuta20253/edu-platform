# frozen_string_literal: true

module Api
  module V1
    module Student
      class TasksController < Api::V1::Student::BaseController
        def index
          tasks = current_user
                  .tasks
                  .by_status(params[:status])
                  .order(due_date: :asc)
                  .page(params[:page])
                  .per(10)

          render json: {
            tasks:
              ActiveModelSerializers::SerializableResource.new(
                tasks,
                each_serializer: TaskSerializer
              ),
            meta: {
              current_page: tasks.current_page,
              total_pages: tasks.total_pages,
              total_count: tasks.total_count,
              per_page: 10
            }
          }, status: :ok
        end

        def show
          task = current_user.tasks.includes(:units).find(params[:id])

          render json: task, serializer: TaskSerializer, status: :ok
        end

        def create
          form = ::Student::CreateTaskForm.new(current_user: current_user, **create_task_params.to_h.symbolize_keys)

          if form.save
            render json: { message: 'タスクが作成されました。' }, status: :created
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        end

        private

        def create_task_params
          params.require(:task).permit(:goal_id, :title, :content, :priority, :due_date, :memo, unit_ids: [])
        end
      end
    end
  end
end
