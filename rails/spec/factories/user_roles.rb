# frozen_string_literal: true

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
