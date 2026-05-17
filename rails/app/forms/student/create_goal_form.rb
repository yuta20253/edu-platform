# frozen_string_literal: true

module Student
  class CreateGoalForm
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

    def initialize(current_user:, **attributes)
      super(attributes)
      @current_user = current_user
    end

    def save
      return unless valid?

      @goal = Goal.create!(
        user: @current_user,
        title: title,
        description: description,
        due_date: parsed_due_date
      )
      true
    end
  end
end
