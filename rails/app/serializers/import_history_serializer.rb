# frozen_string_literal: true

class ImportHistorySerializer < ActiveModel::Serializer
  attributes :id, :file_name, :status, :success_count, :error_count, :total_count, :created_at
end
