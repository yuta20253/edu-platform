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
#  status      :integer          default("not_started"), not null
#  deleted_at  :datetime
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class GoalSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :status, :due_date

  has_many :tasks, each_serializer: TaskSerializer

  def due_date
    object.due_date&.strftime('%Y/%m/%d')
  end
end
