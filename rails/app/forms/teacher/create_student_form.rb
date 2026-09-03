# frozen_string_literal: true

module Teacher
  class CreateStudentForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    KATAKANA_REGEX = /\A[\p{katakana}ー・\s　]+\z/

    attribute :name, :string
    attribute :name_kana, :string
    attribute :email, :string
    attribute :grade_id, :integer
    attribute :school_class_id, :integer

    attr_accessor :current_user
    attr_reader :student

    validates :name, presence: true
    validates :name_kana, presence: true, format: {
      with: KATAKANA_REGEX,
      message: 'はカタカナで入力してください'
    }
    validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :grade_id, presence: true
    validates :school_class_id, presence: true

    validate :grade_must_exist
    validate :school_class_must_exist
    validate :grade_must_be_within_teacher_scope

    def initialize(current_user:, **attributes)
      super(attributes)
      @current_user = current_user
    end

    def save
      return false unless valid?

      @student = Student::CreateStudentService.new(
        name: name,
        name_kana: name_kana,
        email: email,
        high_school: current_user.high_school,
        grade: grade,
        school_class: school_class
      ).call

      true
    rescue ActiveRecord::RecordInvalid => e
      errors.add(:base, e.record.errors.full_messages.join(', '))
      false
    end

    # current_userの所属高校配下に限定して解決するため、他校のgrade_idを
    # 指定した場合は自然にnil(=grade_must_existのエラー)になる。
    def grade
      return @grade if defined?(@grade)
      return @grade = nil if grade_id.blank? || current_user.blank?

      @grade = current_user.high_school.grades.find_by(id: grade_id)
    end

    # gradeにスコープしてSchoolClassを解決するため、学年と学級の不一致も
    # 「このgrade配下にその学級idは存在しない」として自然にエラーになる。
    def school_class
      return @school_class if defined?(@school_class)
      return @school_class = nil if school_class_id.blank? || grade.blank?

      @school_class = grade.school_classes.find_by(id: school_class_id)
    end

    private

    def grade_must_exist
      return if grade_id.blank? || current_user.blank?

      errors.add(:grade_id, 'は所属高校の学年を指定してください') if grade.nil?
    end

    def school_class_must_exist
      return if school_class_id.blank? || grade_id.blank?
      return if grade.nil? # grade自体が見つからない場合はgrade_must_existのエラーに任せる

      errors.add(:school_class_id, 'は学年に存在しません') if school_class.nil?
    end

    def grade_must_be_within_teacher_scope
      # gradeが見つからない場合はgrade_must_existのエラーに任せる
      return if grade.nil? || current_user.blank?
      return unless current_user.teacher_permission&.own_grade?

      errors.add(:grade_id, 'は担当学年ではないため登録できません') if grade.id != current_user.grade_id
    end
  end
end
