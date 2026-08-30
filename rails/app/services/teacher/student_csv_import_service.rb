# frozen_string_literal: true

module Teacher
  class StudentCsvImportService
    def initialize(form)
      @form = form
    end

    def call
      @form.existing_user ? update_existing_user : create_new_user
    end

    private

    # 既存Userの更新対象は氏名・氏名カナ・メール・学年・学級のみ。
    # パスワードや認証状態などCSVで上書きすべきでない項目には触れない。
    def update_existing_user
      user = @form.existing_user
      user.assign_attributes(
        name: @form.name,
        name_kana: @form.name_kana,
        email: @form.email,
        grade: @form.grade,
        school_class: @form.school_class
      )
      user.generate_student_number if user.student_number.blank?
      user.save!
      user
    end

    def create_new_user
      Student::CreateAccountService.new(
        name: @form.name,
        name_kana: @form.name_kana,
        email: @form.email,
        high_school: @form.high_school,
        grade: @form.grade,
        school_class: @form.school_class
      ).call
    end
  end
end
