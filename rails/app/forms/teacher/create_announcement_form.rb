# frozen_string_literal: true

module Teacher
  class CreateAnnouncementForm
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
    validates :title, presence: true
    validates :content, presence: true, length: { maximum: 10_000 }
    validates :status, inclusion: { in: Announcement.statuses.keys }, allow_blank: true

    attr_reader :current_user, :announcement

    def initialize(current_user:, **attributes)
      super(attributes)
      @current_user = current_user
    end

    def save
      return false unless valid?

      @announcement = ::Teacher::CreateAnnouncementService.new(
        publisher: current_user,
        title: title,
        content: content,
        announcement_targets: announcement_targets,
        delivery: { status: status.presence, scheduled_at: scheduled_at }
      ).call
      true
    end
  end
end
