# frozen_string_literal: true

# Admin::AnalyticsQuery の高校別利用状況集計を切り出したモジュール。
# includeするクラスは population/question_histories_scope/study_logs_scope(from_date, to_date)、
# from/to を持つこと。高校ごとにクエリを撃たず、サブクエリを埋め込んだ1クエリで集計する。
module AnalyticsHighSchoolUsable
  # 生徒が1人以上在籍する高校のみ、既定でアクティブ率の昇順（使われていない高校が上）で返す。
  def high_school_usage
    high_school_usage_rows.map do |row|
      high_school_id, name, student_count, active_student_count, answer_count, correct_count = row

      {
        high_school_id: high_school_id,
        high_school_name: name,
        student_count: student_count,
        active_student_count: active_student_count,
        active_rate: ::Student::Analytics::Calculator.correct_rate_from_counts(active_student_count, student_count),
        answer_count: answer_count,
        accuracy_rate: ::Student::Analytics::Calculator.correct_rate_from_counts(correct_count, answer_count)
      }
    end
  end

  private

  # population(User.students...)を直接joinsのベースにすると、population内部の
  # user_rolesへのJOINと、下のサブクエリ文字列に含まれる同名テーブルの記述をActiveRecordが
  # 混同し、外側のJOINを`user_roles_users`に別名化してWHERE句と不整合を起こす。
  # そのため`users.id IN (...)`でpopulationを素通しし、外側は素のUserから組み立てる。
  def high_school_usage_rows
    User.where(id: population.select(:id))
        .joins("LEFT JOIN (#{question_history_stats_sql}) AS qh_stats ON qh_stats.user_id = users.id")
        .joins("LEFT JOIN (#{study_log_flags_sql}) AS sl_flag ON sl_flag.user_id = users.id")
        .joins(:high_school)
        .group(Arel.sql('users.high_school_id'), Arel.sql('high_schools.name'))
        .order(Arel.sql("#{active_rate_sql} ASC"), Arel.sql('users.high_school_id ASC'))
        .pluck(
          Arel.sql('users.high_school_id'),
          Arel.sql('high_schools.name'),
          Arel.sql('COUNT(DISTINCT users.id)'),
          Arel.sql(active_student_count_sql),
          Arel.sql('COALESCE(SUM(qh_stats.answer_count), 0)'),
          Arel.sql('COALESCE(SUM(qh_stats.correct_count), 0)')
        )
  end

  def question_history_stats_sql
    question_histories_scope(from, to)
      .group(:user_id)
      .select(
        :user_id,
        Arel.sql('COUNT(*) AS answer_count'),
        Arel.sql('SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count')
      )
      .to_sql
  end

  def study_log_flags_sql
    study_logs_scope(from, to).select(:user_id).distinct.to_sql
  end

  def active_student_count_sql
    'COUNT(DISTINCT CASE WHEN qh_stats.user_id IS NOT NULL OR sl_flag.user_id IS NOT NULL THEN users.id END)'
  end

  def active_rate_sql
    "(#{active_student_count_sql} / COUNT(DISTINCT users.id))"
  end
end
