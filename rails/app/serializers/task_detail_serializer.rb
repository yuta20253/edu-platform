# frozen_string_literal: true

class TaskDetailSerializer < ActiveModel::Serializer
  attributes :id, :user_id, :goal_id, :title, :content, :due_date, :priority, :status,
             :completed_at, :units

  def units
    ActiveModelSerializers::SerializableResource.new(
      object.units,
      each_serializer: UnitDetailSerializer,
      started_unit_ids: instance_options[:started_unit_ids]
    )
  end

  def due_date
    object.due_date&.strftime('%Y/%m/%d')
  end

  def completed_at
    object.completed_at&.strftime('%Y/%m/%d')
  end
end
