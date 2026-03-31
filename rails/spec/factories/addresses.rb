# frozen_string_literal: true

# == Schema Information
#
# Table name: addresses
#
#  id             :bigint           not null, primary key
#  postal_code    :string(8)        not null
#  city           :string(50)       not null
#  town           :string(50)
#  street_address :string(100)
#  deleted_at     :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  prefecture_id  :bigint
#
FactoryBot.define do
  factory :address do
    postal_code { '1000001' }
    association :prefecture
    city { '千代田区' }
    town { '千代田' }
    street_address { '1-1-1' }
  end
end
