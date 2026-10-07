# frozen_string_literal: true

module Student
  # 紐付け確定前の確認画面向けに、対象Userの学校・学年・学級名のみを返す。
  # 氏名など個人情報は返さない。
  class AccountLinkPreviewService
    def initialize(user:, student_number:)
      @user = user
      @student_number = student_number
    end

    def call
      target_user = AccountLinkFinder.new(user: @user, student_number: @student_number).find!

      {
        high_school_name: target_user.high_school&.name,
        grade_display_name: target_user.grade&.display_name,
        school_class_name: target_user.school_class&.name
      }
    end
  end
end
