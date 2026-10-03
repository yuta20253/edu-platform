class InterviewRequestsQuery
  def initialize(relation)
    @relation = relation
  end

  def for_participant(user)
    @relation = @relation.for_participant(user)
    self
  end

  def within_period(from:, to:)
    @relation = @relation.where(scheduled_at: from.beginning_of_day..to.end_of_day)
    self
  end

  def result
    @relation
  end
end
