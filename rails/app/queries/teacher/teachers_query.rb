# frozen_string_literal: true

module Teacher
  class TeachersQuery
    def initialize(relation)
      @relation = relation
    end

    def colleagues
      @relation = @relation.joins(:user_role).where(user_roles: { name: :teacher })
      self
    end

    def find(id)
      @relation = @relation.find(id)
    end

    def result
      @relation
    end
  end
end
