# frozen_string_literal: true

module Teacher
  # 教員が作成するお知らせは自校内にのみ配信する。
  # all_users/by_roleはhigh_school_idを持たないとAnnouncement.for_userで全校の利用者に
  # マッチしてしまうため、発行者の高校で絞り込む。
  class CreateAnnouncementService < Common::AnnouncementCreateService
    SCHOOL_SCOPED_TARGET_TYPES = %w[all_users by_role].freeze

    private

    def build_target_attributes(target)
      attributes = super
      return attributes unless SCHOOL_SCOPED_TARGET_TYPES.include?(target['target_type'])

      attributes.merge(high_school_id: @publisher.high_school_id)
    end
  end
end
