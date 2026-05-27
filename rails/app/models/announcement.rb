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
end
