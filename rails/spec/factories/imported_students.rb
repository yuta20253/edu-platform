# frozen_string_literal: true

# == Schema Information
#
# Table name: imported_students
#
#  id                 :bigint           not null, primary key
#  import_history_id  :bigint           not null
#  user_id            :bigint           not null
#  action             :integer          not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
FactoryBot.define do
  factory :imported_student do
    association :import_history
    association :user
    action { :created }
  end
end
