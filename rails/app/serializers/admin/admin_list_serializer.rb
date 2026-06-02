# frozen_string_literal: true

module Admin
  class AdminListSerializer < ActiveModel::Serializer
    attributes :id, :name, :email, :created_at
  end
end
