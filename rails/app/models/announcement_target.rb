# frozen_string_literal: true

# == Schema Information
#
# Table name: announcement_targets
#
#  id              :bigint           not null, primary key
#  announcement_id :bigint           not null
#  user_role_id    :bigint
#  grade_id        :bigint
#  high_school_id  :bigint
#  user_id         :bigint
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
class AnnouncementTarget < ApplicationRecord
  belongs_to :announcement
  belongs_to :user_role, optional: true
  belongs_to :grade, optional: true
  belongs_to :high_school, optional: true
  belongs_to :user, optional: true

  enum target_type: {
    all_users: 0,
    by_role: 1,
    by_grade: 2,
    by_school: 3,
    by_user: 4
  }
end
