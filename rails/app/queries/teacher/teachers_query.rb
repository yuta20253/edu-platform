# frozen_string_literal: true

module Teacher
  class TeachersQuery
    def initialize(relation)
      @relation = relation
    end

    def colleagues
      @relation = @relation.includes(:grade,
                                     :teacher_permission).joins(:user_role).where(user_roles: { name: :teacher })
      self
    end

    def result
      @relation
    end
  end
end
