# frozen_string_literal: true

module Api
  module V1
    module Admin
      class UnitsController < BaseController
        def show
          unit = Unit.where(id: params[:id], course_id: params[:course_id])
                     .includes(questions: %i[question_choices question_hints question_explanations])
                     .first
          raise ActiveRecord::RecordNotFound.new(nil, Unit.name) if unit.nil?

          render json: unit, serializer: ::Admin::UnitDetailSerializer
        end
      end
    end
  end
end
