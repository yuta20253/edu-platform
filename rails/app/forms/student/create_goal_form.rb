# frozen_string_literal: true

module Student
  class CreateGoalForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :user
    attribute :title, :string
    attribute :description, :string
    attribute :due_date, :string

    validates :title, presence: true
    validates :due_date, presence: true
    validate :due_date_must_be_valid

    def save
      return unless valid?

      Goal.create!(
        user: user,
        title: title,
        description: description,
        due_date: parsed_due_date
      )
    end

    private

    def due_date_must_be_valid
      return if due_date.blank?

      parsed_due_date
    rescue ArgumentError, TypeError
      errors.add(:due_date, 'は正しい日付を入力してください')
    end

    def parsed_due_date
      @parsed_due_date ||= Date.parse(due_date)
    end
  end
end
