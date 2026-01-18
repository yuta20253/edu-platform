# frozen_string_literal: true

# == Schema Information
#
# Table name: goals
#
#  id          :bigint           not null, primary key
#  user_id     :bigint           not null
#  title       :string(255)      not null
#  description :text(65535)
#  due_date    :date
#  status      :integer          default(0), not null
#  deleted_at  :datetime
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class Goal < ApplicationRecord
  belongs_to :user
  has_many :tasks, dependent: :destroy
end
