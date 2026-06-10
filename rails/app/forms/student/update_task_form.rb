# frozen_string_literal: true

module Student
  class UpdateTaskForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations
    include UnitIdsValidatable
    include PriorityCastable

    attr_reader :task, :unit_ids_provided

    attribute :title, :string
    attribute :content, :string
    attribute :due_date, :string
    attribute :priority, :string
    attribute :memo, :string
    attribute :unit_ids, default: []

    validates :title, presence: true
    validates :content, presence: true
    validates :due_date, presence: true

    validate :due_date_must_be_valid

    def initialize(task:, **attributes)
      @unit_ids_provided = attributes.key?(:unit_ids) && !attributes[:unit_ids].nil?
      super(attributes)
      @task = task
    end

    def save
      return false unless valid?

      ::Student::UpdateTaskService.new(self).call
      true
    end

    def parsed_due_date
      @parsed_due_date ||= Date.parse(due_date)
    end

    private

    def due_date_must_be_valid
      return if due_date.blank?

      parsed_due_date
    rescue ArgumentError, TypeError
      errors.add(:due_date, 'は正しい日付を入力してください')
    end
  end
end
