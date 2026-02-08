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
