# frozen_string_literal: true

module Teacher
  class TeacherNotificationSerializer < ActiveModel::Serializer
    attributes :id, :email, :status, :formatted_sent_at

    belongs_to :sender_user, serializer: ::Teacher::TeacherNotificationUserSerializer
    belongs_to :receiver_user, serializer: ::Teacher::TeacherNotificationUserSerializer

    def formatted_sent_at
      object.sent_at&.strftime('%Y/%m/%d %H:%M')
    end
  end
end
