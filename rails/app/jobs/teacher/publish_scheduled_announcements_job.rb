# frozen_string_literal: true

module Teacher
  class PublishScheduledAnnouncementsJob < ApplicationJob
    queue_as :default

    def perform
      Announcement
        .scheduled
        .where(scheduled_at: 1.minute.ago..Time.current)
        .find_each do |announcement|
          announcement.update!(
            status: :published
          )
        end
    end
  end
end
