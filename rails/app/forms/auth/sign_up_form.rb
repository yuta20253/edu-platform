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

    validates :user_role_name, presence: true
    validates :high_school_id, presence: true, if: :school_required?
    validates :grade_id, presence: true, if: :school_required?
    validate :high_school_require_student_number

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

    def high_school_require_student_number
      @school.csv_csv_managed ? c : student_number_must_be_true
    end

    def student_number_must_be_true
      return if student_number.blank?

      student_number_is_valid?
    end

    def c
      return errors.add(:student_number, '生徒番号は必須です') if student_number.blank?

      student_number_is_valid?
    end

    def student_number_is_valid?
      school_code = student_number.split("-").first

      return errors.add(:student_number, '生徒番号が正しくありません') if school_code != @high_school.school_code

      return errors.add(:student_number, '生徒番号が正しくありません') if User.find_by!(student_number: student_number)
    end

    def high_school
      @high_school ||= HighSchool.find(high_school_id)
    end
  end
end
