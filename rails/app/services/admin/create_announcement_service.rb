# frozen_string_literal: true

module Admin
  class CreateAnnouncementService
    def initialize(publisher:, title:, content:, status:, scheduled_at: nil)
      @publisher = publisher
      @title = title
      @content = content
      @status = status
      @scheduled_at = scheduled_at
    end

    def call
      Common::AnnouncementCreateService.new(
        publisher: @publisher,
        title: @title,
        content: @content,
        announcement_targets: [{ 'target_type' => 'all_users' }],
        delivery: { status: @status, scheduled_at: @scheduled_at }
      ).call
    end
  end
end
