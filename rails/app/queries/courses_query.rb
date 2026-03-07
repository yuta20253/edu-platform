# frozen_string_literal: true

class CoursesQuery
  def initialize(scope = Course.all)
    @scope = scope
  end

  def join_subject
    @scope = @scope.joins(:subject)
    self
  end

  def includes_units
    @scope = @scope.includes(:units)
    self
  end

  def by_subject(name)
    @scope = @scope.where(subjects: { name: name })
    self
  end

  def result
    @scope
  end
end
