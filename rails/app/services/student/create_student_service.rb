# frozen_string_literal: true

module Student
  # 新規生徒Userの初期状態統一(仮パスワード発行・招待待ち状態)と招待メール送信を担う。
  # CSVインポート・教員による単体作成など、生徒アカウントの新規作成経路から共通で呼び出す想定。
  # rubocop:disable Metrics/ParameterLists
  class CreateStudentService < Common::CreateUserService
    def initialize(name:, name_kana:, email:, high_school:, grade:, school_class:)
      super()
      @name = name
      @name_kana = name_kana
      @email = email
      @high_school = high_school
      @grade = grade
      @school_class = school_class
    end
    # rubocop:enable Metrics/ParameterLists

    private

    def role_name
      :student
    end

    def build_user(role, password)
      user = User.new(
        name: @name,
        name_kana: @name_kana,
        email: @email,
        user_role: role,
        high_school: @high_school,
        grade: @grade,
        school_class: @school_class,
        password: password,
        password_confirmation: password,
        password_reset_required: true
      )
      user.generate_student_number
      user
    end
  end
end
