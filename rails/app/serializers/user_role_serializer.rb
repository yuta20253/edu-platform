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
class UserRoleSerializer < ActiveModel::Serializer
  attributes :name
end
