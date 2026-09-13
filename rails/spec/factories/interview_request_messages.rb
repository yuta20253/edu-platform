# frozen_string_literal: true

# == Schema Information
#
# Table name: interview_request_messages
#
#  id                   :bigint           not null, primary key
#  interview_request_id :bigint           not null
#  sender_id            :bigint           not null
#  body                 :text(65535)      not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#
FactoryBot.define do
  factory :interview_request_message do
    association :interview_request
    sender { interview_request.teacher }
    body { '来週の火曜16時はいかがですか?' }
  end
end
