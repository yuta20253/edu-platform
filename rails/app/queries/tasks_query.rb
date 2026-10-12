# frozen_string_literal: true

class TasksQuery
  def initialize(relation)
    @relation = relation
  end

  def within_period(from:, to:)
    @relation = @relation.where(due_date: from..to)
    self
  end

  def due_soon
    @relation = @relation.order(due_date: :asc)
    self
  end

  # Goalのdefault_scope(deleted_at: nil)がjoinにも効くため、論理削除済みの目標に紐づくtaskは除外される
  def with_active_goal
    @relation = @relation.joins(:goal)
    self
  end

  def includes_units
    @relation = @relation.includes(:goal, units: :course)
    self
  end

  def paginate(page: 1, per_page: 10)
    @relation = @relation.page(page).per(per_page)
    self
  end

  def result
    @relation
  end
end
