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
  end
end
