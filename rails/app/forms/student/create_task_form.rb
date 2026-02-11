# frozen_string_literal: true

module Student
  class CreateTaskForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attr_reader :current_user

    attribute :goal_id, :integer
    attribute :title, :string
    attribute :content, :string
    attribute :priority, :integer
    attribute :due_date, :string
    attribute :memo, :string
    attribute :unit_ids, default: []

    validates :goal_id, presence: true
    validates :title, presence: true
    validates :content, presence: true
    validates :priority, presence: true
    validates :due_date, presence: true
    validate :goal_must_exist
    validate :due_date_must_be_valid
    validate :unit_ids_must_exist

    def initialize(current_user:, **attributes)
      super(attributes)
      @current_user = current_user
    end

    def save
      return false unless valid?
      ::Student::CreateTaskService.new(self).call
      true
    end

    def parsed_due_date
      @parsed_due_date ||= Date.parse(due_date)
    end

    def goal
      return @goal if defined?(@goal)

      @goal = current_user.goals.find_by(id: goal_id)
    end

    # フォーム入力を正規化（空文字除去 + integer化）
    def unit_ids
      Array(super).compact_blank.map(&:to_i)
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

    def goal_must_exist
      errors.add(:goal_id, 'が不正です') if goal.nil?
    end
  end
end
