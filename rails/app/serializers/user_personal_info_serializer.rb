# frozen_string_literal: true

class UserPersonalInfoSerializer < ActiveModel::Serializer
  attributes :id, :phone_number, :birthday, :gender
end
