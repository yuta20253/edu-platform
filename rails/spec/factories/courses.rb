# frozen_string_literal: true

# == Schema Information
#
# Table name: courses
#
#  id           :bigint           not null, primary key
#  subject_id   :bigint
#  level_number :integer          default(1), not null
#  level_name   :string(255)      not null
#  description  :text(65535)
#  deleted_at   :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
FactoryBot.define do
  factory :course do
    association :subject
    level_number { 1 }
    level_name { '基礎' }
    description { '基礎レベルのコース' }
  end
end
