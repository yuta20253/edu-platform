# frozen_string_literal: true

class TeachersQuery
  def initialize(relation)
    @relation = relation
  end

  def colleagues
    @relation = @relation.where(user_role_id: 3)
    self
  end

  def find(id)
    @relation = @relation.find(id)
  end

  def result
    @relation
  end
end
