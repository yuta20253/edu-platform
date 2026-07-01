# frozen_string_literal: true

module Admin
  class GradeSerializer < ActiveModel::Serializer
    attributes :id, :year, :display_name
  end
end
