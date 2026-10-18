# frozen_string_literal: true

module Teacher
  class AnnouncementEditSerializer < ActiveModel::Serializer
    attributes :id, :title, :content, :status, :scheduled_at
  end
end
