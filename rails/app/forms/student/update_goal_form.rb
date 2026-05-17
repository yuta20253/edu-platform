# frozen_string_literal: true

module Student
  class UpdateGoalForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations
    include DueDateValidatable

    attr_reader :goal

    attribute :title, :string
    attribute :description, :string
    attribute :due_date, :string

    validates :title, presence: true
    validates :due_date, presence: true

    def initialize(goal:, **attributes)
      super(attributes)
      @goal = goal
    end

    def save
      return false unless valid?

      goal.update(
        title: title,
        description: description,
        due_date: parsed_due_date
      )
    end
  end
end
