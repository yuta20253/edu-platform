# frozen_string_literal: true

class UnitSerializer < ActiveModel::Serializer
  attributes :id, :course_id, :unit_name

  belongs_to :course, serializer: CourseSerializer
end
