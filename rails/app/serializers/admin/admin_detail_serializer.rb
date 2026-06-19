# frozen_string_literal: true

module Admin
  class AdminDetailSerializer < ActiveModel::Serializer
    attributes :id, :name, :email, :created_at, :updated_at, :activity_log

    has_one :user_personal_info, serializer: UserPersonalInfoSerializer
    belongs_to :address, serializer: AddressSerializer

    def activity_log
      []
    end
  end
end
