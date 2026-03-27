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
  belongs_to :school, optional: true
  belongs_to :user, optional: true
end
