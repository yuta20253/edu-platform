# frozen_string_literal: true

module Teacher
  class UpdateAnnouncementForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations
    include AnnouncementTargetsValidatable
    include AnnouncementTargetGradeScopeValidatable

    attribute :title, :string
    attribute :content, :string
    attribute :announcement_targets
    attribute :status, :string
    attribute :scheduled_at, :datetime

    validates :status, inclusion: { in: Announcement.statuses.keys }, allow_blank: true

    validate :announcement_must_be_editable

    attr_reader :current_user, :announcement

    def initialize(current_user:, announcement:, **attributes)
      super(attributes)
      @current_user = current_user
      @announcement = announcement
    end

    def save
      return false unless valid?

      @announcement = ::Teacher::UpdateAnnouncementService.new(
        announcement: @announcement,
        title: title,
        content: content,
        announcement_targets: announcement_targets,
        delivery: { status: status, scheduled_at: scheduled_at }
      ).call
      true
    rescue ActiveRecord::RecordInvalid => e
      e.record.errors.each { |error| errors.add(error.attribute, error.message) }
      false
    end

    private

    def announcement_must_be_editable
      errors.add(:base, '配信済みのお知らせは編集できません') unless @announcement.editable?
    end
  end
end
