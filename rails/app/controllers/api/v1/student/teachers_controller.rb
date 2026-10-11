# frozen_string_literal: true

module Api
  module V1
    module Student
      class TeachersController < Api::V1::Student::BaseController
        def index
          teachers = current_user.school_class&.teachers&.order(:id) || User.none
          render json: { teachers: teachers.as_json(only: %i[id name]) }, status: :ok
        end
      end
    end
  end
end
