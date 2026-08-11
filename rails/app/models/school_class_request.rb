# frozen_string_literal: true

# == Schema Information
#
# Table name: school_class_requests
#
#  id              :bigint           not null, primary key
#  school_class_id :bigint
#  applicant_id    :bigint           not null
#  approver_id     :bigint
#  grade_id        :bigint           not null
#  action          :integer          not null
#  status          :integer          default(0), not null
#  name            :string(255)
#  approved_at     :datetime
#  cancelled_at    :datetime
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
class SchoolClassRequest < ApplicationRecord
  belongs_to :school_class, optional: true
  belongs_to :applicant, class_name: 'User'
  belongs_to :approver, class_name: 'User', optional: true
  belongs_to :grade

  validate :validate_request_attributes

  enum action: {
    create: 0,
    update: 1,
    delete: 2
  }

  enum status: {
    pending: 0,
    approved: 1,
    rejected: 2,
    cancelled: 3
  }

  private

  def validate_request_attributes
    case action
    when 'create'
      validate_create_request
    when 'update'
      validate_update_request
      school_class_belongs_to_grade
    when 'delete'
      validate_delete_request
      school_class_belongs_to_grade
    end
  end

  def validate_create_request
    errors.add(:name, 'を入力してください') if name.blank?
  end

  def validate_update_request
    errors.add(:school_class, 'を指定してください') if school_class.blank?
    errors.add(:name, 'を入力してください') if name.blank?
  end

  def validate_delete_request
    errors.add(:school_class, 'を指定してください') if school_class.blank?
  end

  def school_class_belongs_to_grade
    return if school_class.blank?

    errors.add(:school_class, '学年が一致しません') if school_class.grade_id != grade_id
  end
end
