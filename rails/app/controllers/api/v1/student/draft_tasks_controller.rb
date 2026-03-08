# frozen_string_literal: true

module Api
  module V1
    module Student
      class DraftTasksController < Api::V1::Student::BaseController
        def show
          draft_task = current_user.draft_tasks.includes(units: :course).find(params[:id])
          render json: draft_task, include: ['units.course'], status: :ok
        end

        def create
          form = ::Student::CreateDraftTaskForm.new(current_user: current_user,
                                                    **create_draft_task_params.to_h.symbolize_keys)

          if form.save
            render json: form.draft_task_id, status: :created
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        end

        private

        def create_draft_task_params
          params.require(:draft_task).permit(:goal_id, :title, :content, :priority, :due_date, :memo, unit_ids: [])
        end
      end
    end
  end
end
