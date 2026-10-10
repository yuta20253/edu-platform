# frozen_string_literal: true

module Teacher
  class StudentTaskSerializer < ActiveModel::Serializer
    include DateFormattable

    attributes :id, :title, :status, :priority, :due_date, :completed_at, :goal, :progress, :units

    def due_date
      format_date(object.due_date)
    end

    def completed_at
      format_date(object.completed_at)
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
end
