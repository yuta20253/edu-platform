# frozen_string_literal: true

module Student
  class AccountLinkService
    class AlreadyLinkedError < StandardError; end
    class AlreadyActivatedError < StandardError; end
    class HasDependentDataError < StandardError; end
    class InvalidFormatError < StandardError; end
    class SchoolMismatchError < StandardError; end

    def initialize(user:, student_number:)
      @user = user
      @student_number = student_number
    end

    def call
      find_user!

      ActiveRecord::Base.transaction do
        attrs = link_attrs(@target_user)
        merged_user_id = @target_user.id

        @target_user.destroy!

        @user.update!(attrs)

        AccountLinkAudit.create!(attrs.merge(user: @user, merged_user_id: merged_user_id, result: :success))
      end
    rescue StandardError => e
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
      Rails.logger.error(
        "[AccountLinkService] 失敗監査ログの記録にも失敗: user_id=#{@user&.id} student_number=#{@student_number} " \
        "error=#{e.class} message=#{e.message}"
      )
    end

    def find_user!
      raise InvalidFormatError, '不正な生徒番号です' unless User.student_number_format_valid?(@student_number)

      @target_user = User.active.find_by!(student_number: @student_number)

      raise AlreadyLinkedError, '既に紐付けられています' if @target_user == @user
      raise AlreadyActivatedError, '既に利用されているアカウントです' unless @target_user.password_reset_required
      raise SchoolMismatchError, '生徒コードが正しくありません' if User.high_school_mismatch?(@target_user.high_school_id,
                                                                                              @user.high_school_id)
      raise HasDependentDataError, '統合できません' if dependent_data_exists?
    end

    # Userのhas_many/has_one関連を網羅的にチェックすることで、
    # 新しい関連が追加された際にチェック漏れが発生しないようにする。
    def dependent_data_exists?
      checked_associations.any? do |reflection|
        @target_user.association(reflection.name).scope.exists?
      end
    end

    def checked_associations
      User.reflect_on_all_associations.select do |reflection|
        %i[has_many has_one].include?(reflection.macro) && reflection.options[:through].blank?
      end
    end
  end
end
