# frozen_string_literal: true

module Api
  module V1
    module Student
      class UnitsController < Api::V1::Student::BaseController
        def show
          task = current_user.tasks.find(params[:task_id])
          unit = task.units.includes(:course).find(params[:id])

          render json: unit, serializer: UnitSerializer, status: :ok
        end
      end
    end
  end
end
