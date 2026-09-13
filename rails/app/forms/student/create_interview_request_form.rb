# frozen_string_literal: true

module Student
  class CreateInterviewRequestForm
    include ActiveModel::Model
    include ActiveModel::Attributes

    attribute :teacher_id, :integer
    attribute :reason_category, :string
    attribute :reason_detail, :string

    validates :teacher_id, presence: true
    validates :reason_category, presence: true, inclusion: { in: InterviewRequest.reason_categories.keys }
    validates :reason_detail, presence: true, length: { maximum: 2000 }

    validate :teacher_belongs_to_school_class

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
      errors.add(:base, 'この教員との進行中の面談が既に存在します')
      false
    end

    private

    def create_interview_request
      ::Student::CreateInterviewRequestService.new(
        user: @user, teacher_id: teacher_id, reason_category: reason_category, reason_detail: reason_detail
      ).call
    end

    def teacher_belongs_to_school_class
      return if teacher_id.blank?
      return if @user.school_class.present? && @user.school_class.teachers.exists?(id: teacher_id)

      errors.add(:teacher_id, '申請可能な教員ではありません')
    end
  end
end
