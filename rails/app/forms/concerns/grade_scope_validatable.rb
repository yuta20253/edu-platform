# frozen_string_literal: true

# own_grade権限の教員は、自分の担当学年(TeacherPermission#grade_scope)以外の
# 学年を指定できないようにする。includeするクラスは #grade / #current_user と、
# エラーを積む属性名を返す #grade_scope_error_attribute を実装すること。
module GradeScopeValidatable
  extend ActiveSupport::Concern

  included do
    validate :grade_must_be_within_teacher_scope
  end

  private

  def grade_must_be_within_teacher_scope
    return if grade.nil? || current_user.blank?
    return unless current_user.teacher_permission&.own_grade?

    return if grade.id == current_user.grade_id

    errors.add(grade_scope_error_attribute, 'は担当学年ではないため登録できません')
  end
end
