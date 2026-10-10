# frozen_string_literal: true

module Student
  class AccountLinkService
    class AlreadyLinkedError < StandardError; end
    class AlreadyActivatedError < StandardError; end
    class HasDependentDataError < StandardError; end
    class InvalidFormatError < StandardError; end
    class SchoolMismatchError < StandardError; end

    # 統合失敗として監査ログに残す対象は「この統合試行そのものが失敗した」ケースに限定する。
    # NoMethodErrorなどのバグや、DB接続断・デッドロックのようなインフラ障害
    # (ActiveRecord::StatementInvalid系)まで含めてしまうと、この生徒番号固有の
    # 業務失敗であるかのように誤って記録してしまうため、StandardErrorや
    # ActiveRecord::ActiveRecordErrorのような広い範囲は使わない。
    RESCUABLE_ERRORS = [
      AlreadyLinkedError,
      AlreadyActivatedError,
      HasDependentDataError,
      InvalidFormatError,
      SchoolMismatchError,
      ActiveRecord::RecordNotFound,
      ActiveRecord::RecordInvalid
    ].freeze

    def initialize(user:, student_number:)
      @user = user
      @student_number = student_number
    end

    def call
      find_user!

      ActiveRecord::Base.transaction do
        attrs = link_attrs(@target_user)
        merged_user_id = @target_user.id
        now = Time.current

        # 論理削除は内部的な状態変更のため、招待直後で氏名等が未設定な仮User
        # に対するバリデーション(on: :update)を避け、admins_controller#destroyと
        # 同様に検証・コールバックなしで更新する。student_numberはUNIQUE制約が
        # あるため、統合先(@user)へ引き継ぐ前にnilにしておく(NULLは複数行でも
        # 重複しない)。update_columnsではなくupdate_allを使うのは、@target_user
        # インスタンスのメモリ上の属性を変更しないため。update_columnsだと
        # ロールバック時にDB上の値は戻るがメモリ上はnilのままになり、失敗時に
        # log_failureが参照するstudent_number等が壊れてしまう。
        User.where(id: merged_user_id).update_all(deleted_at: now, student_number: nil, updated_at: now)

        @user.update!(attrs)

        AccountLinkAudit.create!(attrs.merge(user: @user, merged_user_id: merged_user_id, result: :success))
      end
    rescue *RESCUABLE_ERRORS => e
      log_failure(e)
      raise
    end

    private

    def link_attrs(target_user)
      target_user.slice(:high_school_id, :grade_id, :school_class_id, :student_number)
    end

    def log_failure(error)
      Rails.logger.warn(
        "[AccountLinkService] 統合失敗: user_id=#{@user&.id} student_number=#{@student_number} " \
        "error=#{error.class} message=#{error.message}"
      )

      return unless @target_user

      AccountLinkAudit.create!(link_attrs(@target_user).merge(user: @user, merged_user_id: @target_user.id,
                                                              result: :failed))
    rescue StandardError => e
      # 監査ログの記録自体はあくまで副次的な処理なので、ここは元のエラー種別を問わず
      # 広く受け止めて握りつぶし、呼び出し元には常に元のエラー(RESCUABLE_ERRORS)を返す。
      Rails.logger.error(
        "[AccountLinkService] 失敗監査ログの記録にも失敗: user_id=#{@user&.id} student_number=#{@student_number} " \
        "error=#{e.class} message=#{e.message}"
      )
    end

    def find_user!
      finder = AccountLinkFinder.new(user: @user, student_number: @student_number)
      @target_user = finder.find!
    ensure
      # @target_userはこのメソッド専用の一時変数ではなくcall/log_failureでも参照するため、
      # Naming/MemoizedInstanceVariableNameが提案する@find_userへの改名はしない。
      @target_user ||= finder&.target_user # rubocop:disable Naming/MemoizedInstanceVariableName
    end
  end
end
