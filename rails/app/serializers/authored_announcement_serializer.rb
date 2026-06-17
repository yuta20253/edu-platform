# frozen_string_literal: true

class AuthoredAnnouncementSerializer < ActiveModel::Serializer
  attributes :id, :title, :content, :status, :published_at, :scheduled_at
end
