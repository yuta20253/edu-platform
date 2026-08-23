# frozen_string_literal: true

module Auth
  class SignUpForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :email, :string
    attribute :name, :string
    attribute :name_kana, :string
    attribute :password, :string
    attribute :password_confirmation, :string
    attribute :user_role_name, :string
    attribute :high_school_id, :integer
    attribute :grade_id, :integer
    attribute :student_number, :string

    STUDENT_NUMBER_FORMAT = /\A[A-Z0-9]+-[A-Z0-9]+\z/

    validates :user_role_name, presence: true
    validates :high_school_id, presence: true, if: :school_required?
    validates :grade_id, presence: true, if: :school_required?
    validate :student_number_required_for_csv_managed_school, if: :student?
    validate :student_number_format, if: :student?

    def to_attributes
      attrs = {
        email:,
        name:,
        name_kana:,
        password:,
        password_confirmation:
      }
      attrs[:grade_id] = grade_id if school_required?
      attrs
    end

    private

    def school_required?
      user_role_name.in?(%w[student teacher])
    end

    def student?
      user_role_name == 'student'
    end

    # 生徒コードが実在するか・選択した高校と一致するかは Auth::SignUpService 側で検証する
    # （high_school/grade の存在チェックと同じ責務分担）。ここでは入力必須かどうかのみ見る。
    def student_number_required_for_csv_managed_school
      return if high_school_id.blank?

      high_school = HighSchool.find_by(id: high_school_id)
      return if high_school.nil?

      errors.add(:student_number, '生徒番号は必須です') if high_school.csv_managed? && student_number.blank?
    end

    def student_number_format
      return if student_number.blank?

      errors.add(:student_number, '生徒コードの形式が正しくありません') unless student_number.match?(STUDENT_NUMBER_FORMAT)
    end
  end
end
