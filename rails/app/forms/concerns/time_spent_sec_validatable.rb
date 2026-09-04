# frozen_string_literal: true

module TimeSpentSecValidatable
  extend ActiveSupport::Concern

  MAX_TIME_SPENT_SEC = 1.hour.to_i

  included do
    validates :time_spent_sec, numericality: {
      only_integer: true,
      greater_than_or_equal_to: 0,
      less_than_or_equal_to: MAX_TIME_SPENT_SEC
    }, allow_nil: true
  end
end
