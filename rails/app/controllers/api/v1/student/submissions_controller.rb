# frozen_string_literal: true

module Api
  module V1
    module Student
      class SubmissionsController < Api::V1::Student::BaseController
        def update
          status = ::Student::TaskCompletionService.new(
            user: current_user,
            task_id: params[:task_id]
          ).call

          ::Student::TaskStatusUpdaterService.new(
            user: current_user,
            task_id: params[:task_id],
            status: status
          ).call

          render json: { status: status }, status: :ok
        end
      end
    end
  end
end
