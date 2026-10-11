# frozen_string_literal: true

module Student
  class AnalyticsPeriodForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include DateRangeValidatable

    MAX_RANGE_DAYS = 366
    DEFAULT_RANGE_DAYS = 6

    attribute :from, :string
    attribute :to, :string

    validate :validate_period_within_max_range

    def from_date
      return @from_date ||= Date.current - DEFAULT_RANGE_DAYS if from.blank?

      super
    end

    def to_date
      return @to_date ||= Date.current if to.blank?

      super
    end

    private

    def validate_period_within_max_range
      return if from_date.nil? || to_date.nil?

      errors.add(:base, '取得期間は366日以内で指定してください') if (to_date - from_date).to_i > MAX_RANGE_DAYS - 1
    end
  end
end
