class Teacher::StudentGoalSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :status, :due_date, :progress, :tasks

  def due_date
    object.due_date&.strftime('%Y/%m/%d')
  end

  def tasks
    object.tasks.map do |task|
      { id: task.id, title: task.title, status: task.status, due_date: task.due_date&.strftime('%Y/%m/%d') }
    end
  end

  def progress
    task_total_count = object.tasks.size
    task_completed_count = object.tasks.count(&:completed?)

    {
      task_completed_count: task_completed_count,
      task_total_count: task_total_count,
      completion_rate: ::Student::Analytics::Calculator.completion_rate(task_completed_count, task_total_count)
    }
  end
end
