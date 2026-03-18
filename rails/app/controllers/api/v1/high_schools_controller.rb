# frozen_string_literal: true

module Api
  module V1
    class HighSchoolsController < ApplicationController
      def index
        schools = if params[:keyword].present?
                    HighSchool.where('name LIKE ?', "%#{params[:keyword]}%").limit(20)
                  else
                    HighSchool.all
                  end

        render json: schools, each_serializer: HighSchoolSerializer, status: :ok
      end
    end
  end
end
