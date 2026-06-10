# frozen_string_literal: true

module Teacher
  class CreateAnnouncementService
    def initialize(form)
      @form = form
    end

    def call
      ActiveRecord::Base.transaction do
        announcement = Announcement.create!(
          title: @form.title,
          content: @form.content,
          status: :draft,
          publisher_id: @form.current_user.id
        )

        @form.announcement_targets.each do |target|
          announcement.announcement_targets.create!(
            build_target_attributes(target)
          )
        end
      end
    end

    private

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
          high_school_id: @form.current_user.high_school_id
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
