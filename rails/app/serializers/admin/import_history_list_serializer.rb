# frozen_string_literal: true

module Admin
  class ImportHistoryListSerializer < ActiveModel::Serializer
    attributes :id, :course, :unit, :user, :file_name, :status, :mode,
               :total_count, :success_count, :error_count, :created_at

    def course
      unit = object.unit
      return nil if unit&.course.nil?

      { id: unit.course.id, level_name: unit.course.level_name }
    end

    def unit
      return nil if object.unit.nil?

      { id: object.unit.id, unit_name: object.unit.unit_name }
    end

    def user
      return nil if object.user.nil?

      { id: object.user.id, name: object.user.name }
    end
  end
end
