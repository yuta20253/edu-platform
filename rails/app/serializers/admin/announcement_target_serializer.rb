# frozen_string_literal: true

module Admin
  class AnnouncementTargetSerializer < ActiveModel::Serializer
    attributes :id, :target_type, :high_school_id, :grade_id, :user_role_id, :user_id
  end
end
