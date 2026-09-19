# frozen_string_literal: true

module Teacher
  class ImportHistoriesQuery
    include ImportHistoriesFilterable

    def initialize(teacher, scope = ImportHistory.all)
      @teacher = teacher
      @scope = scope.student.where(user_id: @teacher.id).includes(:imported_students, :import_errors)
    end

    def call(filters = {})
      active
      by_status(filters[:status])
      by_period(filters[:from], filters[:to])
      order_by(filters[:sort], filters[:order])
      result
    end
  end
end
