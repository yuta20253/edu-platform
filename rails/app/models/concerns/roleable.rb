# frozen_string_literal: true

module Roleable
  extend ActiveSupport::Concern

  def admin?
    user_role&.admin?
  end

  def student?
    user_role&.student?
  end

  def teacher?
    user_role&.teacher?
  end

  def guardian?
    user_role&.guardian?
  end

  def requires_high_school?
    user_role&.student? || user_role&.teacher?
  end
end
