# frozen_string_literal: true

module Teacher
  class TeacherSchoolClassGradeSerializer < ActiveModel::Serializer
    attributes :id, :year, :display_name

    has_many :school_classes
  end
end
