# frozen_string_literal: true

# == Schema Information
#
# Table name: subjects
#
#  id         :bigint           not null, primary key
#  name       :string(255)      not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
FactoryBot.define do
  factory :subject do
    name { '英語' }
  end
end
