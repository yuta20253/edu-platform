# frozen_string_literal: true

module Admin
  class CourseDetailSerializer < ActiveModel::Serializer
    attributes :id, :subject, :level_number, :level_name, :description, :units

    def subject
      { id: object.subject.id, name: object.subject.name }
    end

    def units
      counts = instance_options[:questions_counts] || {}
      object.units.order(:id).map do |unit|
        {
          id: unit.id,
          unit_name: unit.unit_name,
          questions_count: counts[unit.id] || 0
        }
      end
    end
  end
end
