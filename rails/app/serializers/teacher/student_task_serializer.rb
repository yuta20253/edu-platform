class Teacher::StudentTaskSerializer < ActiveModel::Serializer
  attributes :id, :title, :status, :priority, :due_date, :completed_at, :goal, :progress, :units

  def due_date
    object.due_date&.strftime('%Y/%m/%d')
  end

  def completed_at
    object.completed_at&.strftime('%Y/%m/%d')
  end

  def goal
    {
      id: object.goal.id,
      title: object.goal.title
    }
  end

  def progress
    task_stats.except(:units)
  end

  def units
    object.units.map do |unit|
      Teacher::StudentTaskUnitSerializer.new(unit, progress: task_stats[:units][unit.id]).as_json
    end
  end

  private

  def task_stats
    instance_options[:task_progress][object.id]
  end
end
