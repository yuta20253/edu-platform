# frozen_string_literal: true

module Teacher
  class CreateTeacherForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    KATAKANA_REGEX = /\A[\p{katakana}ー・\s　]+\z/

    attribute :name, :string
    attribute :name_kana, :string
    attribute :email, :string
    attribute :grade_scope, :integer
    attribute :manage_other_teachers, :boolean
    attribute :grade_id, :integer

    validates :name, presence: true
    validates :name_kana, presence: true, format: {
      with: KATAKANA_REGEX,
      message: 'はカタカナで入力してください'
    }
    validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :grade_scope, inclusion: { in: TeacherPermission.grade_scopes.values }
    validates :manage_other_teachers, inclusion: { in: [true, false] }
    validates :grade_id, presence: true
    validate :grade_id_must_be_in_high_school

    def initialize(current_user:, **attributes)
      super(attributes)
      @current_user = current_user
    end

    def save
      return false unless valid?

      ActiveRecord::Base.transaction do
        teacher_role = UserRole.find_by!(name: :teacher)
        password = SecureRandom.hex(16)

        user = User.create!(
          name: name,
          name_kana: name_kana,
          email: email,
          password: password,
          password_confirmation: password,
          user_role: teacher_role,
          grade_id: grade_id,
          high_school: @current_user.high_school
        )

        user.create_teacher_permission!(
          grade_scope: grade_scope,
          manage_other_teachers: manage_other_teachers
        )
        true
      end
    rescue ActiveRecord::RecordInvalid => e
      errors.add(:base, e.record.errors.full_messages.join(', '))
      false
    end

    private

    def grade_id_must_be_in_high_school
      return if grade_id.blank?

      return if Grade.exists?(id: grade_id, high_school_id: @current_user.high_school_id)

      errors.add(:grade_id, 'は所属高校の学年を指定してください')
    end
  end
end
