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
#
class Announcement < ApplicationRecord
  has_many :announcement_targets, dependent: :destroy
  belongs_to :publisher, class_name: 'User'

  enum status: {
    draft: 0,
    scheduled: 1,
    published: 2
  }

  scope :for_user, lambda { |user|
    base = joins(:announcement_targets)

    base
      .where(announcement_targets: { target_type: :all_users })
      .or(
        base
          .where(announcement_targets: { target_type: :by_role, user_role_id: user.user_role_id })
      )
      .or(
        base
          .where(announcement_targets: { target_type: :by_school, high_school_id: user.high_school_id })
      )
      .or(
        base
          .where(announcement_targets: { target_type: :by_grade, grade_id: user.grade_id })
      )
      .distinct
  }

  scope :targeting_all_users, lambda {
    joins(:announcement_targets).where(announcement_targets: { target_type: :all_users })
  }

  scope :targeting_by_role, lambda { |role_id|
    joins(:announcement_targets)
      .where(announcement_targets: { target_type: :by_role, user_role_id: role_id })
  }

  scope :targeting_by_school, lambda { |school_id|
    joins(:announcement_targets)
      .where(announcement_targets: { target_type: :by_school, high_school_id: school_id })
  }

  scope :targeting_by_grade, lambda { |grade_id|
    joins(:announcement_targets)
      .where(announcement_targets: { target_type: :by_grade, grade_id: grade_id })
  }
end
