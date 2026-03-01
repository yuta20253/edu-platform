class TeacherServicePolicy < ApplicationPolicy
  def access?
    teacher?
  end
end
