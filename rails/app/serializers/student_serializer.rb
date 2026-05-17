# frozen_string_literal: true

class StudentSerializer < ActiveModel::Serializer
  attributes :id, :name, :name_kana, :email, :profile_completed

  has_one :user_personal_info, serializer: UserPersonalInfoSerializer
  belongs_to :high_school, serializer: HighSchoolSerializer
  belongs_to :address, serializer: AddressSerializer
  belongs_to :grade, serializer: GradeSerializer

  def profile_completed
    object.profile_completed?
  end
end
