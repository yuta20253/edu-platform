# frozen_string_literal: true

module Api
  module V1
    module Admin
      class AddressesController < BaseController
        def index
          return render json: { errors: ['都道府県は必須です。'] }, status: :bad_request if params[:prefecture_id].blank?

          addresses = AddressesQuery.new(
            prefecture_id: params[:prefecture_id],
            city: params[:city],
            town: params[:town]
          ).call

          render json: addresses, each_serializer: AddressSerializer, status: :ok
        end
      end
    end
  end
end
