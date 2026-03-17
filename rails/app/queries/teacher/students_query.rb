# frozen_string_literal: true

module Teacher
  class StudentsQuery
    def initialize(relation)
      @relation = relation
    end

    def students
      @relation = @relation.joins(:user_role).where(user_roles: { name: :student })
      self
    end

    def my_grade(grade_id)
      @relation = @relation.where(grade_id: grade_id)
      self
    end

    def result
      @relation
    end
  end
end
