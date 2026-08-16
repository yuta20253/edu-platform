# frozen_string_literal: true

# == Schema Information
#
# Table name: teacher_school_classes
#
#  id              :bigint           not null, primary key
#  user_id         :bigint           not null
#  school_class_id :bigint           not null
#  role            :integer          not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
FactoryBot.define do
  factory :teacher_school_class do
    user { association :user, :teacher }
    association :school_class
    role { :homeroom }
  end
end
