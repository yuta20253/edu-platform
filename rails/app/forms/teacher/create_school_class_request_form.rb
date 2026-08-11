# frozen_string_literal: true

module Teacher
  class CreateSchoolClassRequestForm
    include ActiveModel::Model
    include ActiveModel::Attributes

    attribute :name, :string
    attribute :grade_id, :integer

    validates :name, presence: true
    validates :grade_id, presence: true
    validate :grade_belongs_to_user_high_school

    def initialize(user:, **attributes)
      super(attributes)
      @user = user
    end

    def save
      return false unless valid?

      ::Teacher::CreateSchoolClassRequestService.new(user:, attributes: attributes).call
    end

    private

    def grade_belongs_to_user_high_school
      return if grade_id.blank?

      return if @user.high_school.grades.exists?(id: grade_id)

      errors.add(:grade_id, '学年IDが存在しません')
    end
  end
end
