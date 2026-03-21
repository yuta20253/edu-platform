# frozen_string_literal: true

module Api
  module V1
    class PrefecturesController < ApplicationController
      skip_before_action :authenticate_user!

      def index
        prefectures = Prefecture.all
        render json: prefectures, each_serializer: PrefectureSerializer, status: :ok
      end
    end
  end
end
