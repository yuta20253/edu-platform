# frozen_string_literal: true

class AnnouncementsQuery
  def initialize(scope = Announcement.where(publisher_id: User.admins.active.select(:id)))
    @scope = scope.includes(:publisher, :announcement_targets)
  end

  def search(keyword)
    keyword = keyword.to_s
    return self if keyword.blank?

    pattern = "%#{ActiveRecord::Base.sanitize_sql_like(keyword)}%"
    @scope = @scope.where('announcements.title LIKE :p', p: pattern)
    self
  end

  def filter_by_status(status)
    return self if status.blank? || !Announcement.statuses.key?(status.to_s)

    @scope = @scope.where(status: status)
    self
  end

  def order_default
    @scope = @scope.order(created_at: :desc, id: :desc)
    self
  end

  def result
    @scope
  end
end
