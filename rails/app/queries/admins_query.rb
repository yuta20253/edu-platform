# frozen_string_literal: true

class AdminsQuery
  def initialize(scope = User.admins.where(deleted_at: nil))
    @scope = scope
  end

  def search(keyword)
    return self if keyword.blank?

    pattern = "%#{ActiveRecord::Base.sanitize_sql_like(keyword)}%"
    @scope = @scope.where('users.name LIKE :p OR users.email LIKE :p', p: pattern)
    self
  end

  def order_default
    @scope = @scope.order(created_at: :desc)
    self
  end

  def result
    @scope
  end
end
