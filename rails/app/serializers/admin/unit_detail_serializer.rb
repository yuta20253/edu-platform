# frozen_string_literal: true

module Admin
  class UnitDetailSerializer < ActiveModel::Serializer
    attributes :id, :course_id, :unit_name, :questions, :recent_import_histories

    RECENT_IMPORT_HISTORIES_LIMIT = 5

    def questions
      ActiveModelSerializers::SerializableResource.new(
        object.questions.order(:id),
        each_serializer: ::Admin::QuestionDetailSerializer
      ).as_json
    end

    def recent_import_histories
      ActiveModelSerializers::SerializableResource.new(
        object.import_histories.order(started_at: :desc).limit(RECENT_IMPORT_HISTORIES_LIMIT),
        each_serializer: ::ImportHistorySerializer
      ).as_json
    end
  end
end
