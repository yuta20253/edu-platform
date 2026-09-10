# frozen_string_literal: true

class AnnouncementPolicy < ApplicationPolicy
  def update?
    editable_by_owner?
  end

  def destroy?
    editable_by_owner?
  end

  def publish?
    editable_by_owner?
  end

  private

  def editable_by_owner?
    return false unless admin?

    record.publisher_id == user.id && record.editable?
  end
end
