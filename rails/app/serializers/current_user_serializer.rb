# frozen_string_literal: true

class CurrentUserSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :profile_completed

  belongs_to :user_role
  belongs_to :high_school
  belongs_to :user_personal_info

  def profile_completed
    object.profile_completed?
  end
end
