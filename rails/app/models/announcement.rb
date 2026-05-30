# frozen_string_literal: true

# == Schema Information
#
# Table name: announcements
#
#  id           :bigint           not null, primary key
#  title        :string(255)      not null
#  content      :text(65535)      not null
#  status       :integer          default("draft"), not null
#  published_at :datetime
#  publisher_id :bigint           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  scheduled_at :datetime
#
class Announcement < ApplicationRecord
  before_validation :set_published_at

  has_many :announcement_targets, dependent: :destroy
  belongs_to :publisher, class_name: 'User'

  enum :status, {
    draft: 0,
    scheduled: 1,
    published: 2
  }, validate: true

  scope :for_user, lambda { |user|
    joins(:announcement_targets)
      .where(
        "(announcement_targets.high_school_id IS NULL OR announcement_targets.high_school_id = ?) AND
        (announcement_targets.user_role_id IS NULL OR announcement_targets.user_role_id = ?) AND
        (announcement_targets.grade_id IS NULL OR announcement_targets.grade_id = ?) AND
        (announcement_targets.user_id IS NULL OR announcement_targets.user_id = ?)",
        user.high_school_id,
        user.user_role_id,
        user.grade_id,
        user.id
      )
      .distinct
  }

  validate :scheduled_at_must_be_future

  private

  def scheduled_at_must_be_future
    return unless scheduled?

    if scheduled_at.blank?
      errors.add(:scheduled_at, 'を指定してください')
    elsif scheduled_at < Time.current
      errors.add(:scheduled_at, 'は未来日時を指定してください')
    end
  end

  def set_published_at
    return unless will_save_change_to_status?
    return unless published?

    self.published_at = Time.current
  end
end
