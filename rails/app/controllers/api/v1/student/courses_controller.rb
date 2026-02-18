# frozen_string_literal: true

module Api
  module V1
    module Student
      class CoursesController < Api::V1::Student::BaseController
        def index
          courses = CoursesQuery.new.includes_units.result
          if params[:subject].present?
            courses = CoursesQuery.new.join_subject.includes_units.by_subject(params[:subject]).result
          end

          render json: courses.as_json(include: :units), status: :ok
        end
      end
    end
  end
end
