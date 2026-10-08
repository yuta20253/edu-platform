# frozen_string_literal: true

class CurrentUserSerializer < ActiveModel::Serializer
  attributes :id, :name, :name_kana, :email, :profile_completed, :account_linked

  has_one :user_personal_info, serializer: UserPersonalInfoSerializer
  has_one :teacher_permission, serializer: TeacherPermissionSerializer
  belongs_to :user_role, serializer: UserRoleSerializer
  belongs_to :high_school, serializer: HighSchoolSerializer
  belongs_to :address, serializer: AddressSerializer
  belongs_to :grade, serializer: GradeSerializer

  def profile_completed
    object.profile_completed?
  end

  # 生徒コード(student_number)を持っていれば学校発行アカウントと紐付け済み。
  # 紐付けは生徒のみの概念なので、生徒以外はnilを返す。
  def account_linked
    return nil unless object.student?

    object.student_number.present?
  end
end
