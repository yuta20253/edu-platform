# frozen_string_literal: true

module Api
  module V1
    module Student
      class GoalsController < Api::V1::Student::BaseController
        def create
          form = Student::CreateGoalForm.new(create_goal_params)

          if form.save
            render json: { message: '目標が作成できました' }, status: :created
          else
            render json: { errors: form.errors }, status: :unprocessable_entity
          end
        end

        private

        def create_goal_params
          params.require(:goal).permit(:title, :description, :due_date).merge(user: current_user)
        end
      end
    end
  end
end
