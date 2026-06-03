# frozen_string_literal: true

module Admin
  class CourseListSerializer < ActiveModel::Serializer
    attributes :id, :level_name, :subject, :level_number, :units_count, :questions_count, :created_at

    def subject
      return nil if object.subject.nil?

      { id: object.subject.id, name: object.subject.name }
    end

    def units_count
      (instance_options[:units_counts] || {})[object.id] || 0
    end

    def questions_count
      (instance_options[:questions_counts] || {})[object.id] || 0
    end
  end
end
