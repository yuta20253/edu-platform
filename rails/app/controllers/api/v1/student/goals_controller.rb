# frozen_string_literal: true

module Api
  module V1
    module Student
      class GoalsController < Api::V1::Student::BaseController
        def create
          form = ::Student::CreateGoalForm.new(create_goal_params.merge(current_user: current_user))

          if form.save
            render json: form.goal.id, status: :created
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        end

        private

        def create_goal_params
          params.require(:goal).permit(:title, :description, :due_date)
        end
      end
    end
  end
end
