# frozen_string_literal: true

module Teacher
  class PublishScheduledAnnouncementsJob < ApplicationJob
    queue_as :default

    def perform
      Announcement
        .scheduled
        .find_each do |announcement|
          announcement.update!(status: :published)
          Rails.logger.info("announcement id=#{announcement.id}")
      end
    end
  end
end
