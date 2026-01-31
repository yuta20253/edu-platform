# frozen_string_literal: true

module Api
  module V1
    module Student
      class DashboardsController < ApplicationController
        before_action :authenticate_user!

        def show
          goals = GoalsQuery.new(current_user.goals).due_soon.limit_five.result
          render json: goals, each_serializer: GoalSerializer, status: :ok
        end
      end
    end
  end
end
