# frozen_string_literal: true

module Admin
  class AnnouncementSerializer < ActiveModel::Serializer
    attributes :id, :title, :content, :status, :published_at, :scheduled_at,
               :created_at, :targets

    belongs_to :publisher, serializer: AnnouncementPublisherSerializer

    def targets
      high_school_id = instance_options[:high_school_id]

      object.announcement_targets.select { |t| t.high_school_id == high_school_id }.map do |t|
        {
          id: t.id,
          target_type: t.target_type,
          high_school_id: t.high_school_id,
          grade_id: t.grade_id,
          user_role_id: t.user_role_id,
          user_id: t.user_id
        }
      end
    end
  end
end
