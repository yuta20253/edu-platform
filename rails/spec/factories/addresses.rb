FactoryBot.define do
  factory :address do
    postal_code { "1000001" }
    prefecture { "東京都" }
    city { "千代田区" }
    town { "千代田" }
    street_address { "1-1-1" }
  end
end
