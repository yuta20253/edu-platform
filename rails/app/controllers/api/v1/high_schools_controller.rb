# frozen_string_literal: true

module Api
  module V1
    class HighSchoolsController < ApplicationController
      skip_before_action :authenticate_user!

      def index
        schools = HighSchoolsQuery.new(HighSchool.all).filter_prefecture(params[:prefecture_id])

        schools = schools.filter_high_school(params[:keyword]) if params[:keyword].present?

        schools = schools.result.order(:name).limit(20)

        render json: schools, each_serializer: HighSchoolSerializer, status: :ok
      end
    end
  end
end
