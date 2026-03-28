# frozen_string_literal: true

# == Schema Information
#
# Table name: units
#
#  id         :bigint           not null, primary key
#  course_id  :bigint           not null
#  unit_name  :string(255)      not null
#  deleted_at :datetime
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class UnitSerializer < ActiveModel::Serializer
  attributes :id, :course_id, :unit_name

  belongs_to :course, serializer: CourseSerializer
end
