# frozen_string_literal: true

module Admin
  class ImportHistoriesQuery
    SORT_WHITELIST = %w[created_at total_count success_count error_count status].freeze
    ORDER_WHITELIST = %w[asc desc].freeze
    DEFAULT_SORT = 'created_at'
    DEFAULT_ORDER = 'desc'

    def initialize(scope = ImportHistory.all)
      @scope = scope.question.includes(:user, unit: :course)
    end

    def call(filters = {})
      active
      by_status(filters[:status])
      by_unit_id(filters[:unit_id])
      by_course_id(filters[:course_id])
      by_user_id(filters[:user_id])
      by_period(filters[:from], filters[:to])
      order_by(filters[:sort], filters[:order])
      result
    end

    def active
      @scope = @scope.active
      self
    end

    def by_status(status)
      return self unless status.is_a?(String) || status.is_a?(Symbol)
      return self if status.to_s.blank?
      return self unless ImportHistory.statuses.key?(status.to_s)

      @scope = @scope.where(status: status)
      self
    end

    def by_unit_id(id)
      return self if id.blank?
      return self unless id.is_a?(String) || id.is_a?(Integer)

      @scope = @scope.where(unit_id: id)
      self
    end

    def by_course_id(id)
      return self if id.blank?
      return self unless id.is_a?(String) || id.is_a?(Integer)

      @scope = @scope.joins(:unit).where(units: { course_id: id })
      self
    end

    def by_user_id(id)
      return self if id.blank?
      return self unless id.is_a?(String) || id.is_a?(Integer)

      @scope = @scope.where(user_id: id)
      self
    end

    def by_period(from, to)
      from_date = parse_date(from)
      to_date = parse_date(to)

      @scope = @scope.where(import_histories: { created_at: from_date.beginning_of_day.. }) if from_date
      @scope = @scope.where(import_histories: { created_at: ..to_date.end_of_day }) if to_date
      self
    end

    def order_by(sort, order)
      sort_key = SORT_WHITELIST.include?(sort.to_s) ? sort.to_s : DEFAULT_SORT
      order_dir = ORDER_WHITELIST.include?(order.to_s) ? order.to_s : DEFAULT_ORDER
      # タイブレークは id: :desc 固定。デフォルトの並び順（created_at desc = 新しい順）と
      # 向きを揃えるため、Admin::CoursesQuery の id: :asc とは意図的に異なる。
      @scope = @scope.order(import_histories: { sort_key => order_dir }).order(id: :desc)
      self
    end

    def result
      @scope
    end

    private

    def parse_date(value)
      return nil unless value.is_a?(String)
      return nil if value.blank?

      Date.parse(value)
    rescue ArgumentError
      nil
    end
  end
end
