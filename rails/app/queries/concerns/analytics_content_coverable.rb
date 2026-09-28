# frozen_string_literal: true

# Admin::AnalyticsQuery のコンテンツカバレッジ集計を切り出したモジュール。
# includeするクラスは from/to を持つこと。high_school_id/subject_idの影響を受けない、
# コンテンツ在庫側の全体指標。
module AnalyticsContentCoverable
  # 3値それぞれにCOUNTクエリを撃たず、単元ごとの相関サブクエリ(EXISTS)による
  # 条件付き集計で1クエリにまとめる。
  def content_coverage
    total, without_questions, without_answers = active_units.pick(
      Arel.sql('COUNT(*)'),
      Arel.sql("SUM(CASE WHEN NOT EXISTS (#{question_exists_sql}) THEN 1 ELSE 0 END)"),
      Arel.sql(
        "SUM(CASE WHEN EXISTS (#{question_exists_sql}) " \
        "AND NOT EXISTS (#{answered_exists_sql}) THEN 1 ELSE 0 END)"
      )
    )

    {
      total_units: total.to_i,
      units_without_questions: without_questions.to_i,
      units_without_answers: without_answers.to_i
    }
  end

  private

  def active_units
    Unit.active.joins(:course).merge(Course.active)
  end

  def question_exists_sql
    Question.active.where('questions.unit_id = units.id').select('1').to_sql
  end

  def answered_exists_sql
    QuestionHistory.active
                   .where(answered_at: jst_range(from, to))
                   .where('question_histories.unit_id = units.id')
                   .select('1')
                   .to_sql
  end
end
