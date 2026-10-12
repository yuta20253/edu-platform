# frozen_string_literal: true

module Common
  # お知らせの配信先1件分の指定から、announcement_targetsに保存する属性を組み立てる。
  # school_scoped: true のときは、all_users/by_roleにも発行者の高校を設定して自校内の配信に絞り込む。
  # (high_school_idを持たないとAnnouncement.for_userで全校の利用者にマッチしてしまうため)
  class BuildAnnouncementTargetAttributesService
    SCHOOL_SCOPED_TARGET_TYPES = %w[all_users by_role].freeze

    def initialize(publisher:, target:, school_scoped:)
      @publisher = publisher
      @target = target
      @school_scoped = school_scoped
    end

    def call
      attributes = base_attributes
      return attributes unless @school_scoped && SCHOOL_SCOPED_TARGET_TYPES.include?(@target['target_type'])

      attributes.merge(high_school_id: @publisher.high_school_id)
    end

    private

    def base_attributes
      case @target['target_type']
      when 'all_users'
        {
          target_type: :all_users
        }
      when 'by_role'
        {
          target_type: :by_role,
          user_role_id: @target['user_role_id']
        }
      when 'by_grade'
        {
          target_type: :by_grade,
          grade_id: @target['grade_id'],
          user_role_id: @target['user_role_id']
        }
      when 'by_school'
        {
          target_type: :by_school,
          high_school_id: @publisher.high_school_id
        }
      when 'by_user'
        {
          target_type: :by_user,
          user_id: @target['user_id']
        }
      else
        raise ActiveRecord::RecordInvalid
      end
    end
  end
end
