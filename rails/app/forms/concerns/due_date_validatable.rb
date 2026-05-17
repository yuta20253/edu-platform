# frozen_string_literal: true

module DueDateValidatable
  extend ActiveSupport::Concern

  included do
    validate :due_date_must_be_valid
  end

  private

  def due_date_must_be_valid
    return if due_date.blank?

    parsed_due_date
  rescue ArgumentError, TypeError
    errors.add(:due_date, 'は正しい日付を入力してください')
  end

  def parsed_due_date
    @parsed_due_date ||= Date.parse(due_date)
  end
end
