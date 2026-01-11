class CurrentUserSerializer < ActiveModel::Serializer
  attributes :id, :name, :email

  belongs_to :user_role
  belongs_to :high_school
end
