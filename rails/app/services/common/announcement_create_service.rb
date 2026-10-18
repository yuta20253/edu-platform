# frozen_string_literal: true

module Common
  class AnnouncementCreateService
    def initialize(publisher:, title:, content:, announcement_targets:, delivery: {})
      @publisher = publisher
      @title = title
      @content = content
      @announcement_targets = announcement_targets
      @status = delivery[:status] || initial_status
      @scheduled_at = delivery[:scheduled_at]
    end

    def call
      ActiveRecord::Base.transaction do
        announcement = Announcement.create!(
          title: @title,
          content: @content,
          status: @status,
          scheduled_at: @scheduled_at,
          publisher_id: @publisher.id,
          system_generated: system_generated?
        )

        @announcement_targets.each do |target|
          announcement.announcement_targets.create!(
            BuildAnnouncementTargetAttributesService.new(
              publisher: @publisher, target: target, school_scoped: school_scoped?
            ).call
          )
        end

        announcement
      end
    end

    private

    def initial_status
      :draft
    end

    def system_generated?
      false
    end

    def school_scoped?
      false
    end
  end
end
