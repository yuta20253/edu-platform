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
#  system_generated :boolean          default(FALSE), not null
#
class Announcement < ApplicationRecord
  include StatusTransitionValidatable

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

  # target_typeごとに条件を分けて(target_type, high_school_id)等のインデックスを効かせ、UNIONで重複を除いてからJOINする。
  # where(id: ...)のIN副問い合わせにするとMySQLが相関サブクエリに変換して全件を評価するため、派生テーブルとしてJOINしている。
  scope :for_user, lambda { |user|
    branches = [
      AnnouncementTarget.where(target_type: :all_users, high_school_id: [nil, user.high_school_id]),
      AnnouncementTarget.where(target_type: :by_role, user_role_id: user.user_role_id,
                               high_school_id: [nil, user.high_school_id]),
      AnnouncementTarget.where(target_type: :by_grade, grade_id: user.grade_id, user_role_id: [nil, user.user_role_id]),
      AnnouncementTarget.where(target_type: :by_school, high_school_id: user.high_school_id),
      AnnouncementTarget.where(target_type: :by_user, user_id: user.id)
    ]

    matched_ids_sql = branches.map { |branch| branch.select(:announcement_id).to_sql }.join(' UNION ')
    joins("INNER JOIN (#{matched_ids_sql}) AS matched ON matched.announcement_id = announcements.id")
  }

  scope :for_high_school, lambda { |high_school_id|
    joins(:announcement_targets)
      .where(announcement_targets: { high_school_id: high_school_id })
      .distinct
  }

  validates :title, presence: true, length: { maximum: 255 }
  validates :content, presence: true, length: { maximum: 10_000 }
  validate :scheduled_at_must_be_future
  validate :immutable_once_published, on: :update

  def editable?
    status_was != 'published'
  end

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

    self.published_at ||= Time.current
  end

  def prevent_destroy_when_published
    return if editable?

    errors.add(:base, 'は配信済みのため削除できません')
    throw :abort
  end

  def immutable_once_published
    return if editable?

    errors.add(:base, 'は配信済みのため編集できません')
  end
end
