# frozen_string_literal: true

class GoalSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :formatted_status, :formatted_due_date

  def formatted_status
    {
      'not_started' => '未着手',
      'in_progress' => '進行中',
      'completed' => '完了'
    }[object.status]
  end

  def formatted_due_date
    object.due_date&.strftime('%Y/%m/%d')
  end
end
