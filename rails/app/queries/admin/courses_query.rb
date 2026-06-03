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

    def by_subject_id(id)
      return self if id.blank?
      return self unless id.is_a?(String) || id.is_a?(Integer)

      @scope = @scope.where(subject_id: id)
      self
    end

    def search(keyword)
      return self if keyword.blank?

      pattern = "%#{ActiveRecord::Base.sanitize_sql_like(keyword.to_s)}%"
      @scope = @scope.where('courses.level_name LIKE :q OR courses.description LIKE :q', q: pattern)
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
