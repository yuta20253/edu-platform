# frozen_string_literal: true

class AdminServicePolicy < ApplicationPolicy
  def access?
    admin?
  end
end
