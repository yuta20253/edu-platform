# frozen_string_literal: true

module Student
  class CalendarForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    MAX_RANGE_DAYS = 92

    attribute :from, :string
    attribute :to, :string

    validates :from, presence: true
    validates :to, presence: true

    validate :from_must_be_valid_date
    validate :to_must_be_valid_date
    validate :validate_from_before_to
    validate :validate_period_within_max_range

    def from_date
      return if parsed_from.nil?

      @from_date ||= parsed_from
    end

    def to_date
      return if parsed_to.nil?

      @to_date ||= parsed_to
    end

    private

    def from_must_be_valid_date
      return if from.blank?

      Date.parse(from)
    rescue ArgumentError, TypeError
      errors.add(:from, 'は正しい日付を入力してください')
    end

    def to_must_be_valid_date
      return if to.blank?

      Date.parse(to)
    rescue ArgumentError, TypeError
      errors.add(:to, 'は正しい日付を入力してください')
    end

    def validate_from_before_to
      return if from_date.nil? || to_date.nil?

      errors.add(:to, 'はfrom以降の日付を指定してください') if from_date > to_date
    end

    def validate_period_within_max_range
      return if from_date.nil? || to_date.nil?

      errors.add(:base, '取得期間は92日以内で指定してください') if (to_date - from_date).to_i > MAX_RANGE_DAYS - 1
    end

    def parsed_from
      return @parsed_from if defined?(@parsed_from)

      @parsed_from = parse_date(from)
    end

    def parsed_to
      return @parsed_to if defined?(@parsed_to)

      @parsed_to = parse_date(to)
    end

    def parse_date(value)
      return nil unless value.is_a?(String)
      return nil if value.blank?

      Date.parse(value)
    rescue ArgumentError
      nil
    end
  end
end
