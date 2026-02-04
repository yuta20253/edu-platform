# frozen_string_literal: true

class StudentServicePolicy < ApplicationPolicy
  def access?
    student?
  end
end
