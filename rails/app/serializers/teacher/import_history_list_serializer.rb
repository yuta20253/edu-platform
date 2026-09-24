# frozen_string_literal: true

module Teacher
  class ImportHistoryListSerializer < ActiveModel::Serializer
    attributes :id, :file_name, :status, :mode, :total_count, :success_count, :error_count, :created_at
  end
end
