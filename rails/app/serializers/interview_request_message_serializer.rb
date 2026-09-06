# frozen_string_literal: true

class InterviewRequestMessageSerializer < ActiveModel::Serializer
  attributes :id, :body, :sender_id, :sender_name, :created_at

  def sender_name
    object.sender.name
  end
end
