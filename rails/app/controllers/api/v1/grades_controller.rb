# frozen_string_literal: true

module Api
  module V1
    class GradesController < ApplicationController
      def index
        grades = Grade.where(high_school_id: params[:high_school_id])
        render json: grades, each_serializer: GradeSerializer, status: :ok
      end
    end
  end
end
