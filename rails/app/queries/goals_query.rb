# frozen_string_literal: true

class GoalsQuery
  def initialize(relation)
    @relation = relation
  end

  def due_soon
    @relation.order(due_date: :asc)
    self
  end

  def limit_five
    @relation.limit(5)
    self
  end

  def result
    @relation
  end
end
