# frozen_string_literal: true

module Teacher
  class StudentsQuery
    def initialize(relation)
      @relation = relation
    end

    def students
      @relation = @relation.includes(:grade).joins(:user_role).where(user_roles: { name: :student })
      self
    end

    def my_grade(grade_id)
      @relation = @relation.where(grade_id: grade_id)
      self
    end

    def result
      @relation
    end

    def call(grade_id: nil)
      students
      my_grade(grade_id) if grade_id.present?
      result
    end
  end
end
