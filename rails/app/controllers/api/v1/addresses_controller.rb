# frozen_string_literal: true

module Api
  module V1
    class AddressesController < ApplicationController
      def index
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
