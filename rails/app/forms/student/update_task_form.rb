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

    validates :title, presence: true, length: { maximum: 100 }
    validates :content, presence: true
    validates :due_date, presence: true

    validate :due_date_must_be_valid
    validate :started_unit_cannot_be_removed
    validate :due_date_must_not_be_after_goal_due_date

    def initialize(task:, **attributes)
      @unit_ids_provided = attributes.key?(:unit_ids) && !attributes[:unit_ids].nil?
      super(attributes)
      @task = task
    end

    def save
      return false unless valid?

      ::Student::UpdateTaskService.new(self).call
    end

    def parsed_due_date
      @parsed_due_date ||= Date.parse(due_date)
    end

    private

    def due_date_must_not_be_after_goal_due_date
      return if goal.nil?
      return if goal.due_date.blank?
      return if due_date.blank?
      return if errors[:due_date].present?

      errors.add(:due_date, 'は目標の期限以前にしてください') if goal.due_date < parsed_due_date
    end

    def goal
      @task.goal
    end

    def due_date_must_be_valid
      return if due_date.blank?

      parsed_due_date
    rescue ArgumentError, TypeError
      errors.add(:due_date, 'は正しい日付を入力してください')
    end

    def started_unit_cannot_be_removed
      return unless unit_ids_provided

      started_unit_ids = task.started_unit_ids

      removed_started_unit_ids = started_unit_ids - unit_ids.map(&:to_i)

      return if removed_started_unit_ids.empty?

      errors.add(:unit_ids, '学習開始済みの単元は削除できません')
    end
  end
end
