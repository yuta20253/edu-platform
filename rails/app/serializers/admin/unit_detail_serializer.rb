# frozen_string_literal: true

module Admin
  class UnitDetailSerializer < ActiveModel::Serializer
    attributes :id, :course_id, :unit_name, :questions, :recent_import_histories

    def questions
      []
    end

    def recent_import_histories
      []
    end
  end
end
