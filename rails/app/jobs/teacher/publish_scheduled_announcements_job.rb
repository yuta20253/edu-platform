# frozen_string_literal: true

module Teacher
  class PublishScheduledAnnouncementsJob < ApplicationJob
    queue_as :default

    def perform
      Announcement
        .scheduled
        .where(scheduled_at: ..Time.current)
        .find_each do |announcement|
          publish(announcement)
      end
    end

    private

    def publish(announcement)
      announcement.with_lock do
        announcement.update!(status: :published)
        Rails.logger.info("published announcement id=#{announcement.id}")
      end
    rescue StandardError => e
      Rails.logger.error("failed to publish announcement id=#{announcement.id}: #{e.class} #{e.message}")
    end
  end
end
