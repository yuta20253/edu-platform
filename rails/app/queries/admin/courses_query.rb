# frozen_string_literal: true

module Admin
  class CoursesQuery
    SORT_WHITELIST = %w[level_name created_at id].freeze
    ORDER_WHITELIST = %w[asc desc].freeze
    DEFAULT_SORT = 'created_at'
    DEFAULT_ORDER = 'desc'

    def initialize(scope = Course.all)
      @scope = scope
    end

    def active
      @scope = @scope.where(deleted_at: nil)
      self
    end

    def order_by(sort, order)
      sort_key = SORT_WHITELIST.include?(sort.to_s) ? sort.to_s : DEFAULT_SORT
      order_dir = ORDER_WHITELIST.include?(order.to_s) ? order.to_s : DEFAULT_ORDER
      @scope = @scope.order(sort_key => order_dir)
      self
    end

    def result
      @scope
    end
  end
end
