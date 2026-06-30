# frozen_string_literal: true

class UnitDetailSerializer < ActiveModel::Serializer
  attributes :id, :course_id, :unit_name, :course, :started

  def started
    instance_options[:started_unit_ids]&.include?(object.id) || false
  end

  def course
    {
      id: object.course.id,
      level_number: object.course.level_number,
      level_name: object.course.level_name
    }
  end
end
