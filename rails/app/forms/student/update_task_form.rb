# frozen_string_literal: true

module Student
  class UpdateTaskForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attr_reader :task, :unit_ids_provided

    attribute :title, :string
    attribute :content, :string
    attribute :due_date, :string
    attribute :priority, :string
    attribute :memo, :string

    validates :title, presence: true
    validates :content, presence: true
    validates :priority, presence: true
    validates :due_date, presence: true
    validates :memo, presence: true

    validate :due_date_must_be_valid
    validate :unit_ids_must_exist

    def initialize(task:, **attributes)
      @unit_ids_provided = attributes.key?(:unit_ids)
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

    # フォーム入力を正規化（空文字除去 + integer化）
    def unit_ids
      Array(super).compact_blank.map(&:to_i)
    end

    def priority
      value = super
      return if value.blank?

      if value.to_s.match?(/\A\d+\z/)
        Task.priorities.key(value.to_i)
      else
        value
      end
    end

    private

    def due_date_must_be_valid
      return if due_date.blank?

      parsed_due_date
    rescue ArgumentError, TypeError
      errors.add(:due_date, 'は正しい日付を入力してください')
    end

    def unit_ids_must_exist
      return if unit_ids.blank?

      return unless Unit.where(id: unit_ids).count != unit_ids.size

      errors.add(:unit_ids, 'に不正な値が含まれています')
    end
  end
end
