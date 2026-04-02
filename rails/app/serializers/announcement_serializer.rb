# frozen_string_literal: true

class AnnouncementSerializer < ActiveModel::Serializer
  attributes :id, :title, :content, :published_at
end
