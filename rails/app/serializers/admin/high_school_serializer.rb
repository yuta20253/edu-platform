# frozen_string_literal: true

module Admin
  class HighSchoolSerializer < ActiveModel::Serializer
    attributes :id, :name, :prefecture_name, :student_count, :teacher_count, :created_at, :updated_at

    def prefecture_name
      object.prefecture.name
    end

    def student_count
      instance_options[:student_counts][object.id] || 0
    end

    def teacher_count
      instance_options[:teacher_counts][object.id] || 0
    end
  end
end
