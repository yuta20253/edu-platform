# frozen_string_literal: true

module Admin
  # 管理者分析・レポート画面（#70）の期間・フィルタパラメータを検証する。
  #
  # from/to は文字列として受け取り、Date.parse できない場合はフォーマットエラーとする。
  # 未指定時は直近30日（today - 29 .. today）をデフォルト期間とする。
  class AnalyticsFilterForm
    include ActiveModel::Model
    include ActiveModel::Attributes

    MAX_RANGE_DAYS = 366
    DEFAULT_RANGE_DAYS = 29

    attribute :from, :string
    attribute :to, :string
    attribute :high_school_id, :integer
    attribute :subject_id, :integer

    validate :validate_date_range

    def from_date
      @from_date ||= parsed_from || DEFAULT_RANGE_DAYS.days.ago.to_date
    end

    def to_date
      @to_date ||= parsed_to || Date.current
    end

    private

    def parsed_from
      return @parsed_from if defined?(@parsed_from)

      @parsed_from = parse_date(from)
    end

    def parsed_to
      return @parsed_to if defined?(@parsed_to)

      @parsed_to = parse_date(to)
    end

    def validate_date_range
      validate_date_format(:from, from, parsed_from)
      validate_date_format(:to, to, parsed_to)
      return if errors[:from].present? || errors[:to].present?

      validate_from_before_to
      validate_within_max_range
    end

    def validate_date_format(attr, raw_value, parsed_value)
      return if raw_value.blank? || parsed_value.present?

      errors.add(attr, 'は正しい日付形式(YYYY-MM-DD)で指定してください')
    end

    def validate_from_before_to
      errors.add(:base, '開始日は終了日より前の日付を指定してください') if from_date > to_date
    end

    def validate_within_max_range
      return if from_date > to_date
      return if (to_date - from_date + 1) <= MAX_RANGE_DAYS

      errors.add(:base, "指定できる期間は#{MAX_RANGE_DAYS}日以内です")
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
