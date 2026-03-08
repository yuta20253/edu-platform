class Teacher::StudentsQuery
  def initialize(relation)
    @relation = relation
  end

  def students
    @relation = @relation.where(user_role: :student)
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
