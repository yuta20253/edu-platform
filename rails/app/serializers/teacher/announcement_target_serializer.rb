# frozen_string_literal: true

module Teacher
  # 編集画面で選択済みの生徒名を表示できるよう、by_userの配信先には生徒名も返す
  class AnnouncementTargetSerializer < ActiveModel::Serializer
    attributes :id, :target_type, :high_school_id, :grade_id, :user_role_id, :user_id, :user_name

    def user_name
      object.user&.name
    end
  end
end
