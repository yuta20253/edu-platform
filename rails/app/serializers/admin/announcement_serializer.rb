# frozen_string_literal: true

module Admin
  class AnnouncementSerializer < ActiveModel::Serializer
    attributes :id, :title, :content, :status, :published_at, :scheduled_at,
               :created_at, :publisher, :targets

    def publisher
      { id: object.publisher_id, name: object.publisher&.name }
    end

    def targets
      object.announcement_targets.map do |t|
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
