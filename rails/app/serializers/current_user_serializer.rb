# frozen_string_literal: true

class CurrentUserSerializer < ActiveModel::Serializer
  attributes :id, :name, :name_kana, :email, :profile_completed

  has_one :user_personal_info, serializer: UserPersonalInfoSerializer
  belongs_to :user_role
  belongs_to :high_school

  def profile_completed
    object.profile_completed?
  end
end
