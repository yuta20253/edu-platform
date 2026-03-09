# frozen_string_literal: true

class GoalsQuery
  def initialize(relation)
    @relation = relation
  end

  def find(id)
    @relation = @relation.find(id)
  end

  def due_soon
    @relation = @relation.order(due_date: :asc)
    self
  end

  def limit_five
    @relation = @relation.limit(5)
    self
  end

  def includes_tasks
    @relation = @relation.includes(:tasks)
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
