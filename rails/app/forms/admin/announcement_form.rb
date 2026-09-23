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

    attr_reader :publisher, :announcement

    validates :title, presence: true, unless: :updating?
    validates :content, presence: true, unless: :updating?
    validates :status, presence: true, unless: :updating?
    validates :status, inclusion: { in: VALID_STATUSES }, allow_blank: true

    def initialize(publisher: nil, announcement: nil, **attributes)
      super(attributes)
      @publisher = publisher
      @announcement = announcement
      @provided_attribute_names = attributes.keys
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
      ::Admin::CreateAnnouncementService.new(
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
      success = announcement.update(update_attributes)

      copy_errors(announcement) unless success
      success
    end

    def update_attributes
      @provided_attribute_names.index_with { |name| public_send(name) }
    end

    def copy_errors(record)
      record.errors.each { |error| errors.add(error.attribute, error.message) }
    end
  end
end
