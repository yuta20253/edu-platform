# frozen_string_literal: true

module Api
  module V1
    module Admin
      class CourseAssignmentsController < BaseController
        def index
          school = HighSchool.find(params[:high_school_id])
          assignments = school.course_assignments.includes(course: :subject).order(:created_at)

          render json: {
            course_assignments: ActiveModelSerializers::SerializableResource.new(
              assignments,
              each_serializer: ::Admin::CourseAssignmentSerializer
            )
          }
        end

        def create
          school = HighSchool.find(params[:high_school_id])
          assignment = school.course_assignments.create!(course_id: params[:course_id])

          render json: { course_assignment: ::Admin::CourseAssignmentSerializer.new(assignment) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        def destroy
          school = HighSchool.find(params[:high_school_id])
          assignment = school.course_assignments.find_by!(course_id: params[:id])
          assignment.destroy!

          head :no_content
        end
      end
    end
  end
end
