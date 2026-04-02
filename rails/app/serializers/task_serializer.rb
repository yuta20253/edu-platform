# frozen_string_literal: true

# == Schema Information
#
# Table name: tasks
#
#  id             :bigint           not null, primary key
#  user_id        :bigint           not null
#  goal_id        :bigint
#  title          :string(100)      not null
#  content        :text(65535)      not null
#  priority       :integer          default("normal"), not null
#  due_date       :date
#  estimated_time :integer
#  status         :integer          default("not_started"), not null
#  memo           :text(65535)
#  completed_at   :datetime
#  deleted_at     :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class TaskSerializer < ActiveModel::Serializer
  attributes :id, :user_id, :goal_id, :title, :content, :due_date, :priority, :status,
             :completed_at

  has_many :units, each_serializer: UnitSerializer

  def due_date
    object.due_date&.strftime('%Y/%m/%d')
  end

  def completed_at
    object.completed_at&.strftime('%Y/%m/%d')
  end
end
