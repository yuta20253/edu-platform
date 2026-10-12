# frozen_string_literal: true

class AnnouncementPolicy < ApplicationPolicy
  def edit?
    update?
  end

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
    return editable_by_admin? if admin?
    return editable_by_teacher? if teacher?

    false
  end

  def editable_by_admin?
    record.publisher_id == user.id || record.publisher.deleted_at?
  end

  def editable_by_teacher?
    record.publisher_id == user.id
  end
end
