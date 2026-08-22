# frozen_string_literal: true

class StudyLogSerializer < ActiveModel::Serializer
  attributes :id, :status, :started_at, :ended_at, :duration_minutes
end
