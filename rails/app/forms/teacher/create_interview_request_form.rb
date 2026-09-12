# frozen_string_literal: true

module Teacher
  class CreateInterviewRequestForm
    include ActiveModel::Model
    include ActiveModel::Attributes

    attribute :student_id, :integer
    attribute :reason_detail, :string

    validates :student_id, presence: true
    validates :reason_detail, presence: true, length: { maximum: 2000 }

    validate :student_belongs_to_teacher_scope

    def initialize(user:, **attributes)
      super(attributes)
      @user = user
    end

    def save
      return false unless valid?

      create_interview_request
    rescue ActiveRecord::RecordInvalid => e
      e.record.errors.each do |error|
        errors.add(error.attribute, error.message)
      end
      false
    rescue ActiveRecord::RecordNotUnique
      errors.add(:base, 'この生徒との進行中の面談が既に存在します')
      false
    end

    private

    def create_interview_request
      ::Teacher::CreateInterviewRequestService.new(
        user: @user, student_id: student_id, reason_detail: reason_detail
      ).call
    end

    def student_belongs_to_teacher_scope
      return if student_id.blank?
      return if target_students.exists?(id: student_id)

      errors.add(:student_id, '担当外の生徒です')
    end

    def target_students
      ::Teacher::StudentsQuery.new(@user.high_school.users).call(grade_id: filter_grade_id)
    end

    def filter_grade_id
      return nil unless @user.teacher_permission.own_grade?

      @user.grade_id
    end
  end
end
