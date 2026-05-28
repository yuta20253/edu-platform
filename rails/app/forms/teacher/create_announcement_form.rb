# frozen_string_literal: true

module Teacher
  class CreateAnnouncementForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :title, :string
    attribute :content, :string
    attribute :announcement_targets

    validates :title, presence: true
    validates :content, presence: true
    validates :announcement_targets, presence: true

    validate :announcement_targets_must_be_array
    validate :target_types_must_be_valid

    attr_reader :current_user

    def initialize(current_user:, **attributes)
      super(attributes)
      @current_user = current_user
    end

    def save
      return false unless valid?

      ::Teacher::CreateAnnouncementService.new(self).call
      true
    end

    private

    def announcement_targets_must_be_array
      return if announcement_targets.is_a?(Array)

      errors.add(:announcement_targets, '配列で指定してください')
    end

    def target_types_must_be_valid
      return if announcement_targets.blank?
      return unless announcement_targets.is_a?(Array)

      valid_types = AnnouncementTarget.target_types.keys

      announcement_targets.each do |target|
        next if valid_types.include?(target['target_type'])

        errors.add(:base, '不正なtarget_typeが含まれています')
      end
    end
  end
end
