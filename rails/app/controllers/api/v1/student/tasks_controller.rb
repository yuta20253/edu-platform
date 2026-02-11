# frozen_string_literal: true

module Api
  module V1
    module Student
      class TasksController < Api::V1::Student::BaseController
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
