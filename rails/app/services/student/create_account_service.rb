# frozen_string_literal: true

module Student
  # 新規生徒Userの初期状態統一(仮パスワード発行・招待待ち状態)と招待メール送信を担う。
  # CSVインポート・教員による単体作成など、生徒アカウントの新規作成経路から共通で呼び出す想定。
  class CreateAccountService
    def initialize(**attributes)
      @name = attributes.fetch(:name)
      @name_kana = attributes.fetch(:name_kana)
      @email = attributes.fetch(:email)
      @high_school = attributes.fetch(:high_school)
      @grade = attributes.fetch(:grade)
      @school_class = attributes[:school_class]
    end

    def call
      password = SecureRandom.hex(16)

      user = User.new(
        name: @name,
        name_kana: @name_kana,
        email: @email,
        user_role: UserRole.find_by!(name: :student),
        high_school: @high_school,
        grade: @grade,
        school_class: @school_class,
        password: password,
        password_confirmation: password,
        password_reset_required: true
      )
      user.generate_student_number
      user.save!

      invite(user)

      user
    end

    private

    def invite(user)
      token = user.send(:set_reset_password_token)
      AuthMailer.invite_user(user, token).deliver_later
    end
  end
end
