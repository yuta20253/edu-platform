class Teacher::ImportHistoriesQuery
  SORT_WHITELIST = %w[created_at total_count success_count error_count status].freeze
  ORDER_WHITELIST = %w[asc desc].freeze
  DEFAULT_SORT = 'created_at'
  DEFAULT_ORDER = 'desc'

  def initialize(teacher, scope = ImportHistory.all)
    @scope = scope
    @teacher = teacher
  end

  def call(filters = {})
    by_status(filters[:status])
    by_period(filters[:from], filters[:to])
    order_by(filters[:sort], filters[:order])
    students
    result
  end

  def students
    @scope = @scope.student.where(user_id: @teacher.id).includes(:imported_students, :import_errors)
  end

  def by_status(status)
    return self unless status.is_a?(String) || status.is_a?(Symbol)
    return self if status.to_s.blank?
    return self unless ImportHistory.statuses.key?(status.to_s)

    @scope = @scope.where(status: status)
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
