# frozen_string_literal: true

# == Schema Information
#
# Table name: teacher_notifications
#
#  id               :bigint           not null, primary key
#  sender_user_id   :bigint           not null
#  receiver_user_id :bigint           not null
#  email            :string(255)      not null
#  sent_at          :datetime
#  status           :string(255)      default("pending"), not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
FactoryBot.define do
  factory :teacher_notification do
  end
end
