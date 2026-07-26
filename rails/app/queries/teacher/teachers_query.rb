# frozen_string_literal: true

module Teacher
  class TeachersQuery
    def initialize(relation)
      @relation = relation
    end

    def colleagues
      @relation = teacher_scope.includes(:grade,
                                         :teacher_permission)
      self
    end

    def colleagues_for_permissions
      @relation = teacher_scope.includes(
        :teacher_permission
      )
      self
    end

    def result
      @relation
    end

    private

    def teacher_scope
      @relation.joins(:user_role).where(user_roles: { name: :teacher })
    end
  end
end
