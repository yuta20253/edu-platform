# frozen_string_literal: true

module Admin
  # 管理者ダッシュボードのKPI・下部データを集計する。
  #
  # 集計母集団は「有効（論理削除されていない）かつ招待受諾済み」のユーザー。
  # 招待受諾の判定に activated_at を使わないのは、activated_at が
  # Auth::SignUpService#claim_existing_student でしか設定されず、通常サインアップや
  # 教師の初回パスワード変更では未設定のままになるため。実質的な受諾フラグは
  # password_reset_required（招待時 true → 本人の初回パスワード変更で false）。
  class DashboardQuery
    ACTIVE_WITHIN_DAYS = 30
    RECENT_IMPORTS_LIMIT = 5
    RECENT_ANNOUNCEMENTS_LIMIT = 3

    attr_reader :active_within_days

    def initialize(active_within_days: ACTIVE_WITHIN_DAYS)
      @active_within_days = active_within_days
    end

    def stats
      counts = role_counts

      {
        student_count: counts.dig('student', :accepted),
        active_student_count: active_student_count,
        teacher_count: counts.dig('teacher', :accepted),
        admin_count: counts.dig('admin', :accepted),
        total_questions: Question.active.count,
        pending_student_count: counts.dig('student', :pending),
        pending_teacher_count: counts.dig('teacher', :pending)
      }
    end

    def recent_imports
      ImportHistory.question.active.order(created_at: :desc, id: :desc).limit(RECENT_IMPORTS_LIMIT)
    end

    def recent_announcements
      AnnouncementsQuery.new.order_default.result.limit(RECENT_ANNOUNCEMENTS_LIMIT)
    end

    # study_logs と question_histories の判定基準をぶらさないため、
    # 1インスタンス内では同じ時刻を使い回す。
    def active_since
      @active_since ||= active_within_days.days.ago
    end

    private

    # ロール別の「受諾済み」「招待中」人数を1クエリで取得する。
    # ロールごとに COUNT を撃たないための条件付き集計。
    def role_counts
      User.active
          .joins(:user_role)
          .group('user_roles.name')
          .pluck(
            Arel.sql('user_roles.name'),
            Arel.sql('SUM(CASE WHEN users.password_reset_required THEN 0 ELSE 1 END)'),
            Arel.sql('SUM(CASE WHEN users.password_reset_required THEN 1 ELSE 0 END)')
          )
          .to_h { |name, accepted, pending| [name, { accepted: accepted.to_i, pending: pending.to_i }] }
          .tap { |counts| counts.default = { accepted: 0, pending: 0 } }
    end

    def active_student_count
      scope = accepted_users.merge(User.students)

      scope.where(id: recent_study_log_user_ids)
           .or(scope.where(id: recent_question_history_user_ids))
           .count
    end

    def accepted_users
      User.active.invitation_accepted.joins(:user_role)
    end

    def recent_study_log_user_ids
      StudyLog.where(deleted_at: nil, started_at: active_since..).select(:user_id)
    end

    def recent_question_history_user_ids
      QuestionHistory.where(deleted_at: nil, answered_at: active_since..).select(:user_id)
    end
  end
end
