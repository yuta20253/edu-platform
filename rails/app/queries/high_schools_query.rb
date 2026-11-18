# frozen_string_literal: true

class HighSchoolsQuery
  def initialize(relation)
    @relation = relation
  end

  def filter_prefecture(id)
    @relation = @relation.where(prefecture_id: id)
    self
  end

  def filter_high_school(name)
    pattern = "%#{ActiveRecord::Base.sanitize_sql_like(name)}%"
    @relation = @relation.where('name LIKE ?', pattern)
    self
  end

  def result
    @relation
  end
end
