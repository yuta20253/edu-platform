# frozen_string_literal: true

# == Schema Information
#
# Table name: announcements
#
#  id           :bigint           not null, primary key
#  title        :string(255)      not null
#  content      :text(65535)      not null
#  status       :integer          default("draft"), not null
#  published_at :datetime
#  publisher_id :bigint           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
FactoryBot.define do
  factory :announcement do
    title { 'テストタイトル' }
    content { 'テスト内容' }
    status { :draft }
    association :publisher, factory: :user
  end
end
