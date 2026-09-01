# frozen_string_literal: true

module Admin
  class CourseAssignmentSerializer < ActiveModel::Serializer
    attributes :id, :course, :assigned_at

    def course
      return nil if object.course.nil?

      {
        id: object.course.id,
        level_number: object.course.level_number,
        level_name: object.course.level_name,
        subject: object.course.subject && { id: object.course.subject.id, name: object.course.subject.name }
      }
    end

    def assigned_at
      object.created_at
    end
  end
end
