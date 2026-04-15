# frozen_string_literal: true

# == Schema Information
#
# Table name: user_personal_infos
#
#  id           :bigint           not null, primary key
#  user_id      :bigint           not null
#  phone_number :string(255)
#  birthday     :date
#  gender       :integer
#  deleted_at   :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
class UserPersonalInfoSerializer < ActiveModel::Serializer
  attributes :id, :phone_number, :birthday, :gender
end
