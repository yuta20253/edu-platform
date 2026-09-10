# frozen_string_literal: true

class AnnouncementPolicy < ApplicationPolicy
  EDITABLE_STATUSES = %w[draft scheduled].freeze

  def update?
    editable_by_owner?
  end

  def destroy?
    editable_by_owner?
  end

  private

  def editable_by_owner?
    return false unless admin?

    record.publisher_id == user.id && EDITABLE_STATUSES.include?(record.status)
  end
end
