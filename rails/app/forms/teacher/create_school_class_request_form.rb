# frozen_string_literal: true

module Teacher
  class CreateSchoolClassRequestForm
    include ActiveModel::Model
    include ActiveModel::Attributes

    attribute :name, :string
    attribute :grade_id, :integer
    attribute :action, :string
    attribute :school_class_id, :integer

    validates :name, presence: true, if: -> { action.in?(%w[creation modification]) }
    validates :grade_id, presence: true
    validates :action, inclusion: { in: ::SchoolClassRequest.actions.keys }

    validate :grade_belongs_to_user_high_school
    validate :school_class_belongs_to_grade

    def initialize(user:, **attributes)
      super(attributes)
      @user = user
    end

    def save
      return false unless valid?

      process_school_class_request
    end

    private

    def process_school_class_request
      ::Teacher::CreateSchoolClassRequestService.new(user: @user, attributes: attributes).call
    end

    def grade_belongs_to_user_high_school
      return if grade_id.blank?

      return if @user.high_school.grades.exists?(id: grade_id)

      errors.add(:grade_id, '学年IDが存在しません')
    end

    def school_class_belongs_to_grade
      return if school_class_id.blank?

      school_class = ::SchoolClass.find_by(id: school_class_id)

      return if school_class&.grade_id == grade_id

      errors.add(:school_class_id, '学年が一致しません')
    end
  end
end
