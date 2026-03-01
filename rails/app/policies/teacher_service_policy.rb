# frozen_string_literal: true

class TeacherServicePolicy < ApplicationPolicy
  def access?
    teacher?
  end
end
