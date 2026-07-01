# frozen_string_literal: true

module Admin
  class AnnouncementSerializer < ActiveModel::Serializer
    attributes :id, :title, :content, :status, :published_at, :scheduled_at,
               :created_at, :targets

    belongs_to :publisher, serializer: AnnouncementPublisherSerializer

    def targets
      high_school_id = instance_options[:high_school_id]
      scoped_targets = object.announcement_targets.select { |t| t.high_school_id == high_school_id }

      ActiveModelSerializers::SerializableResource.new(
        scoped_targets,
        each_serializer: AnnouncementTargetSerializer
      )
    end
  end
end
