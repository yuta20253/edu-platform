# frozen_string_literal: true

# 学年制限のある教員は、自分の学年に絞り込める配信先(自学年のby_grade・自学年の生徒のby_user)
# しか指定できない。all_users/by_role/by_schoolは学年で絞り込めず学年外にも届くため拒否する。
# includeするクラスは #current_user と、配信先を種類で絞り込む #targets_of_type / #targets_of_types を実装すること。
module AnnouncementTargetGradeScopeValidatable
  extend ActiveSupport::Concern

  GRADE_UNRESTRICTABLE_TARGET_TYPES = %w[all_users by_role by_school].freeze

  included do
    validate :announcement_targets_must_be_within_grade_scope
  end

  private

  def announcement_targets_must_be_within_grade_scope
    restriction = current_user.own_grade_restriction
    return if restriction.nil?

    if targets_of_types(*GRADE_UNRESTRICTABLE_TARGET_TYPES).any?
      errors.add(:announcement_targets, '学年が制限されているため指定できない配信先です')
    end

    validate_restricted_grades(restriction)
    validate_restricted_users(restriction)
  end

  def validate_restricted_grades(restriction)
    targets_of_type('by_grade').each do |target|
      next if target['grade_id'].to_i == restriction

      errors.add(:announcement_targets, '指定できない学年です')
    end
  end

  def validate_restricted_users(restriction)
    targets_of_type('by_user').each do |target|
      user = User.find_by(id: target['user_id'])
      next if user.blank?
      next if user.student? && user.grade_id == restriction

      errors.add(:announcement_targets, '指定できないユーザーです')
    end
  end
end
