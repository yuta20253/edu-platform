# frozen_string_literal: true

module Admin
  class AnnouncementForm
    include ActiveModel::Model
    include ActiveModel::Attributes

    VALID_STATUSES = %w[draft scheduled published].freeze

    attribute :title, :string
    attribute :content, :string
    attribute :status, :string
    attribute :scheduled_at, :datetime

    attr_reader :publisher, :announcement, :result

    validates :title, presence: true, unless: :updating?
    validates :content, presence: true, unless: :updating?
    validates :status, presence: true, unless: :updating?
    validates :status, inclusion: { in: VALID_STATUSES }, allow_blank: true

    def initialize(publisher: nil, announcement: nil, **attributes)
      super(attributes)
      @publisher = publisher
      @announcement = announcement
    end

    def save
      return false unless valid?

      updating? ? update_announcement : create_announcement
    end

    private

    def updating?
      announcement.present?
    end

    def create_announcement
      @result = ::Admin::CreateAnnouncementService.new(
        publisher: publisher,
        title: title,
        content: content,
        status: status,
        scheduled_at: scheduled_at
      ).call
      true
    rescue ActiveRecord::RecordInvalid => e
      copy_errors(e.record)
      false
    end

    def update_announcement
      @result = announcement

      if announcement.published?
        errors.add(:status, 'は配信済みのため編集できません')
        return false
      end

      success = announcement.update(
        {
          title: title,
          content: content,
          status: status,
          scheduled_at: scheduled_at
        }.compact
      )

      copy_errors(announcement) unless success
      success
    end

    def copy_errors(record)
      record.errors.each { |error| errors.add(error.attribute, error.message) }
    end
  end
end
