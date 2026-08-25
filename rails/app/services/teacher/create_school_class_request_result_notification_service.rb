# frozen_string_literal: true

module Teacher
  class CreateSchoolClassRequestResultNotificationService
    ACTION_LABELS = {
      'creation' => 'クラス作成',
      'modification' => 'クラス変更',
      'deletion' => 'クラス削除'
    }.freeze

    def initialize(school_class_request:, approver:)
      @school_class_request = school_class_request
      @approver = approver
    end

    def call
      Teacher::CreateSystemAnnouncementService.new(
        publisher: @approver,
        title: title,
        content: content,
        announcement_targets: [
          { 'target_type' => 'by_user', 'user_id' => @school_class_request.applicant_id }
        ]
      ).call
    end

    private

    def title
      @school_class_request.approved? ? "#{action_label}申請が承認されました" : "#{action_label}申請が却下されました"
    end

    def content
      return "#{action_label}の申請が承認されました。" if @school_class_request.approved?

      base = "#{action_label}の申請が却下されました。"
      return base if @school_class_request.reason.blank?

      "#{base}理由: #{@school_class_request.reason}"
    end

    def action_label
      ACTION_LABELS.fetch(@school_class_request.action)
    end
  end
end
