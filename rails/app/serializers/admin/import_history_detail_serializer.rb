# frozen_string_literal: true

module Admin
  class ImportHistoryDetailSerializer < ActiveModel::Serializer
    attributes :id, :course, :unit, :user, :file_name, :status, :mode,
               :total_count, :success_count, :error_count,
               :started_at, :finished_at, :created_at,
               :errors, :warnings

    def course
      course = object.unit&.course
      return nil unless course

      { id: course.id, level_name: course.level_name }
    end

    def unit
      unit = object.unit
      return nil unless unit

      { id: unit.id, unit_name: unit.unit_name }
    end

    def user
      user = object.user
      return nil unless user

      { id: user.id, name: user.name }
    end

    def errors
      object.import_errors.map do |import_error|
        { row_number: import_error.row_number, message: import_error.message }
      end
    end

    def warnings
      []
    end
  end
end
