# frozen_string_literal: true

module Admin
  class AnnouncementListSerializer < ActiveModel::Serializer
    attributes :id, :title, :status, :target_type, :published_at, :scheduled_at, :created_at

    belongs_to :publisher, serializer: AnnouncementPublisherSerializer

    def target_type
      object.announcement_targets.first&.target_type
    end
  end
end
