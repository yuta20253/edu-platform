# frozen_string_literal: true

module Teacher
  # 配信先は差分更新せず、既存分をすべて削除して作り直す。
  # 更新できるのは発行者本人のみ(AnnouncementPolicy)のため、配信先の組み立てにはお知らせの発行者を使う。
  class UpdateAnnouncementService
    def initialize(announcement:, title:, content:, announcement_targets:, delivery: {})
      @announcement = announcement
      @title = title
      @content = content
      @announcement_targets = announcement_targets
      @status = delivery[:status]
      @scheduled_at = delivery[:scheduled_at]
    end

    def call
      ActiveRecord::Base.transaction do
        @announcement.lock!

        update_announcement!

        destroy_announcement_targets

        create_announcement_targets!(@announcement_targets)
      end

      @announcement
    end

    private

    def update_announcement!
      @announcement.update!(
        title: @title,
        content: @content,
        status: @status,
        scheduled_at: @scheduled_at
      )
    end

    def destroy_announcement_targets
      @announcement.announcement_targets.destroy_all
    end

    def create_announcement_target!(target)
      @announcement.announcement_targets.create!(
        Common::BuildAnnouncementTargetAttributesService.new(
          publisher: @announcement.publisher,
          target: target,
          school_scoped: true
        ).call
      )
    end

    def create_announcement_targets!(targets)
      targets.each do |target|
        create_announcement_target!(target)
      end
    end
  end
end
