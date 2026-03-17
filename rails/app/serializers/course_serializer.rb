# frozen_string_literal: true

class CourseSerializer < ActiveModel::Serializer
  attributes :id, :level_number, :level_name
end
