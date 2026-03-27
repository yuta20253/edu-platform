# frozen_string_literal: true

class StudentSerializer < ActiveModel::Serializer
  attributes :id, :name, :name_kana

  belongs_to :grade, serializer: GradeSerializer
end
