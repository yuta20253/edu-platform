# frozen_string_literal: true

module Teacher
  # 学年制限のある教員は、自分の学年に絞り込める配信先(自学年のby_grade・自学年の生徒のby_user)
  # しか指定できない。all_users/by_role/by_schoolは学年で絞り込めず学年外にも届くため拒否する。
  class AnnouncementGradeScopeValidator < ActiveModel::Validator
    GRADE_UNRESTRICTABLE_TARGET_TYPES = %w[all_users by_role by_school].freeze

    def validate(record)
      restriction = record.current_user.own_grade_restriction
      return if restriction.nil?
      return unless record.announcement_targets.is_a?(Array)

      targets = record.announcement_targets.group_by { |t| t['target_type'] }

      if GRADE_UNRESTRICTABLE_TARGET_TYPES.any? { |type| targets.key?(type) }
        record.errors.add(:announcement_targets, '学年が制限されているため指定できない配信先です')
      end

      validate_grades(record, targets.fetch('by_grade', []), restriction)
      validate_users(record, targets.fetch('by_user', []), restriction)
    end

    private

    def validate_grades(record, targets, restriction)
      targets.each do |target|
        next if target['grade_id'].to_i == restriction

        record.errors.add(:announcement_targets, '指定できない学年です')
      end
    end

    def validate_users(record, targets, restriction)
      targets.each do |target|
        user = User.find_by(id: target['user_id'])
        next if user.blank?
        next if user.student? && user.grade_id == restriction

        record.errors.add(:announcement_targets, '指定できないユーザーです')
      end
    end
  end
end
