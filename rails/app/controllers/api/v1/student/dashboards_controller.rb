# frozen_string_literal: true

module Api
  module V1
    module Student
      class DashboardsController < Api::V1::Student::BaseController
        def show
          goals = GoalsQuery.new(current_user.goals).due_soon.limit_five.result
          today_answer_count = ::Student::TodayAnswerCountQuery.new(user: current_user).fetch

          render json: {
            goals: ActiveModelSerializers::SerializableResource.new(
              goals,
              each_serializer: ::Student::GoalSerializer
            ),
            today_answer_count: today_answer_count
          }, status: :ok
        end
      end
    end
  end
end
