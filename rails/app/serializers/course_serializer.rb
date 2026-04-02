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
class CourseSerializer < ActiveModel::Serializer
  attributes :id, :level_number, :level_name
end
