# frozen_string_literal: true

module Api
  module V1
    class AddressesController < ApplicationController
      def index
        if params[:prefecture_id].blank?
          render json: { error: '都道府県は必須です。' }, status: :bad_request
          return
        end

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
