class TasksQuery
  def initialize(relation)
    @relation = relation
  end

  def within_period(from:, to:)
    @relation = @relation.where(due_date: from..to)
    self
  end

  def result
    @relation
  end
end
