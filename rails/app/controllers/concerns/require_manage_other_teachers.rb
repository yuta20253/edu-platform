# frozen_string_literal: true

module RequireManageOtherTeachers
  extend ActiveSupport::Concern

  private

  def manage_other_teachers?
    current_user.teacher_permission&.manage_other_teachers?
  end

  def require_manage_other_teachers!(message)
    return if manage_other_teachers?

    render json: { errors: [message] }, status: :forbidden
  end
end
