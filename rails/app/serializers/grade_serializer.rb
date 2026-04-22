# frozen_string_literal: true

# == Schema Information
#
# Table name: grades
#
#  id             :bigint           not null, primary key
#  high_school_id :bigint           not null
#  year           :integer          not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class GradeSerializer < ActiveModel::Serializer
  attributes :year, :display_name
end
