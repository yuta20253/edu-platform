# frozen_string_literal: true

module Admin
  class ImportHistoriesQuery
    include ImportHistoriesFilterable

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
  end
end
