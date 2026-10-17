# frozen_string_literal: true

# 教員が指定するお知らせの配信先(announcement_targets)の形式・存在・自校内であることを検証する。
# includeするクラスは #announcement_targets と #current_user を実装すること。
module AnnouncementTargetsValidatable
  extend ActiveSupport::Concern

  TARGET_TYPES_REQUIRING_USER_ROLE = %w[by_role by_grade].freeze

  included do
    validates :announcement_targets, presence: true

    validate :announcement_targets_must_be_array
    validate :target_types_must_be_valid
    validate :grade_ids_must_exist
    validate :user_role_ids_must_exist
    validate :user_ids_must_exist
    validate :users_must_belong_to_same_high_school
    validate :grades_must_belong_to_same_high_school
  end

  private

  def targets_of_type(type)
    return [] unless announcement_targets.is_a?(Array)

    announcement_targets.select { |t| t['target_type'] == type }
  end

  def targets_of_types(*types)
    return [] unless announcement_targets.is_a?(Array)

    announcement_targets.select { |t| types.include?(t['target_type']) }
  end

  def announcement_targets_must_be_array
    return if announcement_targets.is_a?(Array)

    errors.add(:announcement_targets, '配列で指定してください')
  end

  def target_types_must_be_valid
    return if announcement_targets.blank?
    return unless announcement_targets.is_a?(Array)

    valid_types = AnnouncementTarget.target_types.keys

    announcement_targets.each do |target|
      next if valid_types.include?(target['target_type'])

      errors.add(:base, '不正なtarget_typeが含まれています')
    end
  end

  def grade_ids_must_exist
    targets_of_type('by_grade').each do |target|
      if target['grade_id'].blank?
        errors.add(:announcement_targets, '学年を指定してください')
      elsif !Grade.exists?(target['grade_id'])
        errors.add(:announcement_targets, '存在しない学年です')
      end
    end
  end

  def user_role_ids_must_exist
    targets_of_types(*TARGET_TYPES_REQUIRING_USER_ROLE).each do |target|
      role_id = target['user_role_id']
      if target['user_role_id'].blank?
        errors.add(:announcement_targets, '権限を指定してください')
      elsif !UserRole.exists?(id: role_id)
        errors.add(:announcement_targets, '存在しない権限です')
      end
    end
  end

  def user_ids_must_exist
    targets_of_type('by_user').each do |target|
      if target['user_id'].blank?
        errors.add(:announcement_targets, 'ユーザーを指定してください')
      elsif !User.exists?(target['user_id'])
        errors.add(:announcement_targets, '存在しないユーザーです')
      end
    end
  end

  def users_must_belong_to_same_high_school
    targets_of_type('by_user').each do |target|
      user = User.find_by(id: target['user_id'])

      next if user.blank?

      errors.add(:announcement_targets, '他校のユーザーは指定できません') if user.high_school_id != current_user.high_school_id
    end
  end

  def grades_must_belong_to_same_high_school
    targets_of_type('by_grade').each do |target|
      grade = Grade.find_by(id: target['grade_id'])

      next if grade.blank?

      errors.add(:announcement_targets, '他校の学年は指定できません') if grade.high_school_id != current_user.high_school_id
    end
  end
end
