# frozen_string_literal: true

# == Schema Information
#
# Table name: user_roles
#
#  id         :bigint           not null, primary key
#  name       :integer          default("student"), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
FactoryBot.define do
  factory :user_role do
    name { :student }

    initialize_with { UserRole.find_or_create_by!(name: name) }

    trait :student do
      name { :student }
    end

    trait :admin do
      name { :admin }
    end

    trait :teacher do
      name { :teacher }
    end

    trait :guardian do
      name { :guardian }
    end
  end
end
