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
    trait :student do
      name { 'student' }

      initialize_with do
        UserRole.find_or_create_by!(name: name)
      end
    end

    trait :admin do
      name { 'admin' }

      initialize_with do
        UserRole.find_or_create_by!(name: name)
      end
    end

    trait :teacher do
      name { 'teacher' }

      initialize_with do
        UserRole.find_or_create_by!(name: name)
      end
    end

    trait :guardian do
      name { 'guardian' }

      initialize_with do
        UserRole.find_or_create_by!(name: name)
      end
    end
  end
end
