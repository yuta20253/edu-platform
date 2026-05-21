# frozen_string_literal: true

module Api
  module V1
    module Admin
      class UnitsController < BaseController
        def show
          unit = Unit.find_by(id: params[:id], course_id: params[:course_id])
          raise ActiveRecord::RecordNotFound.new(nil, Unit.name) if unit.nil?

          render json: unit, serializer: ::Admin::UnitDetailSerializer
        end
      end
    end
  end
end
