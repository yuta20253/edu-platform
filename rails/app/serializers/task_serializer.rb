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
  attributes :id, :user_id, :goal_id, :title, :content, :formatted_due_date, :formatted_priority, :formatted_status,
             :completed_at

  def formatted_status
    {
      'not_started' => '未着手',
      'in_progress' => '進行中',
      'completed' => '完了'
    }[object.status]
  end

  def formatted_priority
    {
      'very_low' => 'とても低い',
      'low' => '低い',
      'normal' => '普通',
      'high' => '高い',
      'very_high' => 'とても高い'
    }[object.priority]
  end

  def formatted_due_date
    object.due_date&.strftime('%Y/%m/%d')
  end

  def formatted_completed_at
    object.completed_at&.strftime('%Y/%m/%d')
  end
end
