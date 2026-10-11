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

    def from_date
      return @from_date ||= Date.current - DEFAULT_RANGE_DAYS if from.blank?

      super
    end

    def to_date
      return @to_date ||= Date.current if to.blank?

      super
    end
  end
end
