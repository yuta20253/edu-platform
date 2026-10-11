# frozen_string_literal: true

module Student
  class CalendarForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations
    include DateRangeValidatable

    MAX_RANGE_DAYS = 92

    attribute :from, :string
    attribute :to, :string

    validates :from, presence: true
    validates :to, presence: true

    validate :validate_period_within_max_range

    private

    def validate_period_within_max_range
      return if from_date.nil? || to_date.nil?

      errors.add(:base, '取得期間は92日以内で指定してください') if (to_date - from_date).to_i > MAX_RANGE_DAYS - 1
    end
  end
end
