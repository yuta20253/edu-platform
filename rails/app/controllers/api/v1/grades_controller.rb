# frozen_string_literal: true

module Api
  module V1
    class GradesController < ApplicationController
      skip_before_action :authenticate_user!

      def index
        grades = Grade.where(high_school_id: params[:high_school_id])
        render json: grades, each_serializer: GradeSerializer, status: :ok
      end
    end
  end
end
