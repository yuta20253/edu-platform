# frozen_string_literal: true

# Admin::AnalyticsQuery の日別推移集計を切り出したモジュール。
# includeするクラスは question_histories_scope(from_date, to_date) と from/to を持つこと。
module AnalyticsDailyActivityable
  # 記録の無い日も0で埋めて、from..toの全日分を返す(グラフを途切れさせない責務はAPI側に置く)。
  def daily_activity
    rows = daily_rows

    (from..to).map do |date|
      row = rows[date.to_s] || { active_student_count: 0, answer_count: 0, correct_count: 0 }

      {
        date: date.to_s,
        active_student_count: row[:active_student_count],
        answer_count: row[:answer_count],
        accuracy_rate: ::Student::Analytics::Calculator.correct_rate_from_counts(
          row[:correct_count], row[:answer_count]
        )
      }
    end
  end

  private

  def daily_rows
    question_histories_scope(from, to)
      .group(Arel.sql(jst_date_expression))
      .pluck(
        Arel.sql(jst_date_expression),
        Arel.sql('COUNT(DISTINCT question_histories.user_id)'),
        Arel.sql('COUNT(*)'),
        Arel.sql('SUM(CASE WHEN question_histories.is_correct THEN 1 ELSE 0 END)')
      )
      .to_h do |bucket_date, active_student_count, answer_count, correct_count|
        [bucket_date.to_s, {
          active_student_count: active_student_count,
          answer_count: answer_count,
          correct_count: correct_count
        }]
      end
  end

  # CONVERT_TZはオフセット形式('+09:00')ならtime zoneテーブル未ロードでも動く。
  # 'Asia/Tokyo'のような名前形式はNULLを返すので使わない。
  def jst_date_expression
    "DATE(CONVERT_TZ(question_histories.answered_at, '+00:00', '+09:00'))"
  end
end
