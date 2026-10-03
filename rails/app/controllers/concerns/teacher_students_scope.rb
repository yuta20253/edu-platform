# frozen_string_literal: true

module TeacherStudentsScope
  extend ActiveSupport::Concern

  private

  def students_scope(grade_id: current_user.own_grade_restriction, keyword: nil)
    ::Teacher::StudentsQuery
      .new(current_user.high_school.users)
      .call(grade_id: grade_id, keyword: keyword)
      .order(:name_kana)
  end
end
