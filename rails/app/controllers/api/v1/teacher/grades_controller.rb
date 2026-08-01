# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class GradesController < Api::V1::Teacher::BaseController
        def index
          grades = current_user.high_school.grades

          render json: grades, each_serializer: GradeSerializer, status: :ok
        end
      end
    end
  end
end
