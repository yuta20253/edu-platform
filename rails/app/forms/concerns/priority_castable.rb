# frozen_string_literal: true

module PriorityCastable
  extend ActiveSupport::Concern

  included do
    validates :priority, presence: true
  end

  def priority
    value = super
    return if value.blank?

    if value.to_s.match?(/\A\d+\z/)
      Task.priorities.key(value.to_i)
    else
      value
    end
  end
end
