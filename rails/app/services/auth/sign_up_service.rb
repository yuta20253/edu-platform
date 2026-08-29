# frozen_string_literal: true

module Auth
  class SignUpService
    class SignUpError < StandardError; end

    def initialize(form)
      @form = form
    end

    def call
      ActiveRecord::Base.transaction do
        role = find_role!
        high_school, grade = resolve_school_context(role)

        if role.student? && @form.student_number.present?
          claim_existing_student(high_school:)
        else
          create_user(role:, high_school:, grade:)
        end
      end
    end

    private

    def find_role!
      role = UserRole.find_by(name: @form.user_role_name)
      raise SignUpError, '無効なユーザーロールです' unless role

      role
    end

    def resolve_school_context(role)
      return [nil, nil] unless role.student? || role.teacher?

      high_school = HighSchool.find_by(id: @form.high_school_id)
      raise SignUpError, '学校が見つかりません' unless high_school

      grade = high_school.grades.find_by(id: @form.grade_id)
      raise SignUpError, '学年が見つかりません' unless grade

      [high_school, grade]
    end

    def create_user(role:, high_school:, grade:)
      User.create!(@form.to_attributes.merge(user_role_id: role.id, high_school:, grade:))
    end

    # 学校のCSVインポート等で事前作成された仮アカウントを、入力された生徒コードで検索し、
    # 見つかればそれを有効化する（新規Userは作らない）。同一生徒の重複登録を防ぐための経路。
    def claim_existing_student(high_school:)
      verify_student_number_school!(high_school:)

      user = User.active.find_by(student_number: @form.student_number)
      raise SignUpError, '生徒コードが正しくありません' unless user
      raise SignUpError, '生徒コードが正しくありません' unless user.high_school_id == high_school.id
      raise SignUpError, 'このアカウントは既に有効化されています' unless user.password_reset_required?

      original_email = user.email
      # grade_idはCSVインポート時に設定済みの値を維持する（high_school_idと同様、フォーム入力で上書きしない）
      user.assign_attributes(@form.to_attributes.except(:grade_id))
      user.password_reset_required = false
      user.activated_at = Time.current
      user.save!
      AuthMailer.account_claimed(user, original_email).deliver_later
      user
    end

    # student_number に含まれる学校コードを取り出し、他校で発行された生徒コードで
    # 選択した高校のアカウントをclaimできないことを、既存User検索の前に確認する。
    def verify_student_number_school!(high_school:)
      school_code = @form.student_number.split('-', 2).first
      code_high_school = HighSchool.find_by(school_code:)
      raise SignUpError, '生徒コードが正しくありません' unless code_high_school
      raise SignUpError, '生徒コードが正しくありません' unless code_high_school.id == high_school.id
    end
  end
end
