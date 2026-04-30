# frozen_string_literal: true

module Teacher
  class TeacherNotificationSerializer < ActiveModel::Serializer
    attributes :id, :email, :status, :sent_at

    belongs_to :sender_user, serializer: ::Teacher::TeacherNotificationUserSerializer
    belongs_to :receiver_user, serializer: ::Teacher::TeacherNotificationUserSerializer
  end
end
