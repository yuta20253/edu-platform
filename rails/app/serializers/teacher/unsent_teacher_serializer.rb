# frozen_string_literal: true

module Teacher
  class UnsentTeacherSerializer < ActiveModel::Serializer
    attributes :id, :name, :name_kana, :email
  end
end
