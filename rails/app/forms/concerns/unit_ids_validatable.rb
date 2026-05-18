# frozen_string_literal: true

module UnitIdsValidatable
  extend ActiveSupport::Concern

  included do
    validate :unit_ids_must_exist
  end

  # フォーム入力を正規化（空文字除去 + integer化）
  def unit_ids
    Array(super).compact_blank.map(&:to_i)
  end

  private

  def unit_ids_must_exist
    return if unit_ids.blank?

    return unless Unit.where(id: unit_ids).count != unit_ids.size

    errors.add(:unit_ids, 'に不正な値が含まれています')
  end
end
