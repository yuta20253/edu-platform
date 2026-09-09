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
  before_destroy :prevent_destroy_when_published

  STATUS_TRANSITIONS = {
    'draft' => %w[scheduled published],
    'scheduled' => %w[published],
    'published' => []
  }.freeze

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

  scope :for_high_school, lambda { |high_school_id|
    joins(:announcement_targets)
      .where(announcement_targets: { high_school_id: high_school_id })
      .distinct
  }

  validates :title, presence: true, length: { maximum: 255 }
  validates :content, presence: true, length: { maximum: 10_000 }
  validate :scheduled_at_must_be_future
  validate :valid_status_transition
  validate :immutable_once_published, on: :update

  private

  def scheduled_at_must_be_future
    return unless scheduled?

    if scheduled_at.blank?
      errors.add(:scheduled_at, 'を指定してください')
    elsif scheduled_at < Time.current
      errors.add(:scheduled_at, 'は未来日時を指定してください')
    end
  end

  def valid_status_transition
    return unless persisted?
    return unless will_save_change_to_status?

    from = status_was
    to = status

    return if STATUS_TRANSITIONS[from].include?(to)

    errors.add(:status, "#{from} から #{to} へは変更できません")
  end

  def set_published_at
    return unless will_save_change_to_status?
    return unless published?

    self.published_at ||= Time.current
  end

  def prevent_destroy_when_published
    return unless published?

    errors.add(:base, 'は配信済みのため削除できません')
    throw :abort
  end

  def immutable_once_published
    return unless status_was == 'published'

    errors.add(:base, 'は配信済みのため編集できません')
  end
end
