# frozen_string_literal: true

module Admin
  class PublishAnnouncementService
    def initialize(announcement)
      @announcement = announcement
    end

    def call
      if @announcement.published?
        @announcement.errors.add(:status, 'はすでに配信済みです')
        return false
      end

      @announcement.update(status: :published, scheduled_at: nil)
    end
  end
end
