class AuthoredAnnouncementSerializer < ActiveModel::Serializer
  attributes :id, :title, :content, :published_at, :status, :published_at, :scheduled_at
end
