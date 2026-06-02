# frozen_string_literal: true

module Admin
  class AdminDetailSerializer < ActiveModel::Serializer
    attributes :id, :name, :email, :created_at, :updated_at, :activity_log

    def activity_log
      []
    end
  end
end
