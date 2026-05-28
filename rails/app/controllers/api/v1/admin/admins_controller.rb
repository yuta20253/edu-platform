# frozen_string_literal: true

module Api
  module V1
    module Admin
      class AdminsController < BaseController
        def index
          head :ok
        end

        def show
          head :ok
        end

        def create
          head :created
        end

        def update
          head :ok
        end

        def destroy
          head :no_content
        end
      end
    end
  end
end
