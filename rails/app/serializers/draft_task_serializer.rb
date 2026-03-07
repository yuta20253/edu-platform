class DraftTaskSerializer < ActiveModel::Serializer
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
