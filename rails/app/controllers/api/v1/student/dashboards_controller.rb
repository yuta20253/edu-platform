class Api::V1::Student::DashboardsController < ApplicationController
  before_action :authenticate_user!

  def show
    goals = GoalsQuery.new(current_user.goals).due_soon.limit_five.result
    render json: goals, each_serializer: GoalSerializer , status: :ok
  end
end
