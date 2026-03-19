# frozen_string_literal: true

module Api
  module V1
    class HighSchoolsController < ApplicationController
      skip_before_action :authenticate_user!

      def index
        return render json: [], status: :ok if params[:keyword].blank?

        schools = HighSchool.where('name LIKE ?', "%#{params[:keyword]}%").order(:name).limit(20)

        render json: schools, each_serializer: HighSchoolSerializer, status: :ok
      end
    end
  end
end
