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
            build_target_attributes(target)
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

    def build_target_attributes(target)
      case target['target_type']
      when 'all_users'
        {
          target_type: :all_users
        }
      when 'by_role'
        {
          target_type: :by_role,
          user_role_id: target['user_role_id']
        }
      when 'by_grade'
        {
          target_type: :by_grade,
          grade_id: target['grade_id'],
          user_role_id: target['user_role_id']
        }
      when 'by_school'
        {
          target_type: :by_school,
          high_school_id: @publisher.high_school_id
        }
      when 'by_user'
        {
          target_type: :by_user,
          user_id: target['user_id']
        }
      else
        raise ActiveRecord::RecordInvalid
      end
    end
  end
end
