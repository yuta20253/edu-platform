# frozen_string_literal: true

module Student
  # AccountLinkService(実際の統合)とAccountLinkPreviewService(確認画面用プレビュー)の
  # 両方で必要な、生徒コードの検証・対象User検索ロジックを共通化する。
  class AccountLinkFinder
    # find!が途中で例外を発生させた場合でも、呼び出し元(AccountLinkService)が
    # 失敗の監査ログにmerged_user_idを残せるよう、発見済みのtarget_userを参照可能にする。
    attr_reader :target_user

    def initialize(user:, student_number:)
      @user = user
      @student_number = student_number
    end

    def find!
      raise AccountLinkService::AlreadyLinkedError, '既に紐付けられています' if @user.student_number.present?
      unless User.student_number_format_valid?(@student_number)
        raise AccountLinkService::InvalidFormatError,
              '不正な生徒番号です'
      end

      @target_user = User.active.find_by!(student_number: @student_number)

      raise AccountLinkService::AlreadyActivatedError, '既に利用されているアカウントです' unless @target_user.password_reset_required
      if User.high_school_mismatch?(@target_user.high_school_id, @user.high_school_id)
        raise AccountLinkService::SchoolMismatchError, '生徒コードが正しくありません'
      end
      raise AccountLinkService::HasDependentDataError, '統合できません' if dependent_data_exists?(@target_user)

      @target_user
    end

    private

    # Userのhas_many/has_one関連を網羅的にチェックすることで、
    # 新しい関連が追加された際にチェック漏れが発生しないようにする。
    def dependent_data_exists?(target_user)
      checked_associations.any? do |reflection|
        target_user.association(reflection.name).scope.exists?
      end
    end

    def checked_associations
      User.reflect_on_all_associations.select do |reflection|
        %i[has_many has_one].include?(reflection.macro) && reflection.options[:through].blank?
      end
    end
  end
end
