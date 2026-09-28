# frozen_string_literal: true

# Admin::AnalyticsQuery のコンテンツカバレッジ集計を切り出したモジュール。
# includeするクラスは from/to を持つこと。high_school_id/subject_idの影響を受けない、
# コンテンツ在庫側の全体指標。
module AnalyticsContentCoverable
  def content_coverage
    units_with_questions = active_units.where(id: Question.active.select(:unit_id))
    units_with_answers = QuestionHistory.active.where(answered_at: jst_range(from, to)).select(:unit_id)

    {
      total_units: active_units.count,
      units_without_questions: active_units.where.not(id: Question.active.select(:unit_id)).count,
      units_without_answers: units_with_questions.where.not(id: units_with_answers).count
    }
  end

  private

  def active_units
    Unit.active.joins(:course).merge(Course.active)
  end
end
