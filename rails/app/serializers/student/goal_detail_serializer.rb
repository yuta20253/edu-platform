# frozen_string_literal: true

module Student
  class GoalDetailSerializer < ActiveModel::Serializer
    attributes :id, :title, :description, :status, :due_date

    has_many :tasks, each_serializer: TaskSerializer

    def due_date
      object.due_date&.strftime('%Y/%m/%d')
    end
  end
end
