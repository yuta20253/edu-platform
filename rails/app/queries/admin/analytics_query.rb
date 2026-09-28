# frozen_string_literal: true

module Admin
  # 管理者向け分析・レポート画面（#70）のための集計。
  #
  # 集計母集団は DashboardQuery と揃えて「有効かつ招待受諾済みの生徒」。
  # question_histories / study_logs はDBに保存されている実データを直接集計し、
  # 常に空である user_overall_question_stats 系テーブルは参照しない。
  class AnalyticsQuery
    MIN_ANSWER_COUNT = 20
    RANKING_LIMIT = 10
    MAX_RANGE_DAYS = 366

    attr_reader :from, :to, :high_school_id, :subject_id

    def initialize(from:, to:, high_school_id: nil, subject_id: nil)
      @from = from
      @to = to
      @high_school_id = high_school_id.presence
      @subject_id = subject_id.presence
    end

    # 「同じ日数だけ手前に遡った連続期間」。例: 直近30日(8/13-9/11) → その前の30日(7/14-8/12)。
    def previous_from
      from - period_days
    end

    def previous_to
      from - 1.day
    end

    def kpis
      current_stats = period_stats(from, to)
      previous_stats = period_stats(previous_from, previous_to)

      current_stats.keys.index_with do |key|
        { current: current_stats[key], previous: previous_stats[key] }
      end
    end

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

    def period_days
      (to - from).to_i + 1
    end

    def period_stats(from_date, to_date)
      total, correct = question_histories_scope(from_date, to_date)
                       .pick(
                         Arel.sql('COUNT(*)'),
                         Arel.sql('SUM(CASE WHEN question_histories.is_correct THEN 1 ELSE 0 END)')
                       )
      total ||= 0
      correct ||= 0

      {
        active_student_count: active_student_count(from_date, to_date),
        answer_count: total,
        accuracy_rate: ::Student::Analytics::Calculator.correct_rate_from_counts(correct, total),
        study_minutes: study_logs_scope(from_date, to_date).sum(:duration_minutes)
      }
    end

    # 期間内に解答または学習記録がある生徒の重複排除数。IDをRubyに読み出さず、
    # サブクエリのORで1クエリにする。
    def active_student_count(from_date, to_date)
      scope = population

      scope.where(id: question_histories_scope(from_date, to_date).select(:user_id))
           .or(scope.where(id: study_logs_scope(from_date, to_date).select(:user_id)))
           .count
    end

    def population
      scope = User.students.active.invitation_accepted
      scope = scope.by_high_school(high_school_id) if high_school_id.present?
      scope
    end

    def question_histories_scope(from_date, to_date)
      scope = QuestionHistory.active
                             .where(user_id: population.select(:id))
                             .where(answered_at: jst_range(from_date, to_date))
      scope = scope.where(course_id: subject_course_ids) if subject_id.present?
      scope
    end

    def study_logs_scope(from_date, to_date)
      scope = StudyLog.active
                      .where(user_id: population.select(:id))
                      .where(started_at: jst_range(from_date, to_date))
      scope = scope.where(unit_id: subject_unit_ids) if subject_id.present?
      scope
    end

    def subject_course_ids
      Course.active.where(subject_id: subject_id).select(:id)
    end

    def subject_unit_ids
      Unit.active.where(course_id: subject_course_ids).select(:id)
    end

    # config.time_zone が "Asia/Tokyo" のため Time.zone は常にJST。
    # DBはUTCで保存されるが、Time.zoneを持つ値はActiveRecordが自動でUTCに変換して問い合わせる。
    def jst_range(from_date, to_date)
      from_date.in_time_zone.beginning_of_day..to_date.in_time_zone.end_of_day
    end
  end
end
