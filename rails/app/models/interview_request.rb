# frozen_string_literal: true

# == Schema Information
#
# Table name: interview_requests
#
#  id              :bigint           not null, primary key
#  student_id      :bigint           not null
#  teacher_id      :bigint           not null
#  initiator_id    :bigint           not null
#  initiator_role  :integer          not null
#  status          :integer          default("requested"), not null
#  reason_category :integer
#  reason_detail   :text(65535)      not null
#  scheduled_at    :datetime
#  completed_at    :datetime
#  cancelled_at    :datetime
#  cancelled_by_id :bigint
#  cancel_reason   :text(65535)
#  lock_version    :integer          default(0), not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  active_pair_key :string(255)
#
class InterviewRequest < ApplicationRecord
  belongs_to :student, class_name: 'User'
  belongs_to :teacher, class_name: 'User'
  belongs_to :initiator, class_name: 'User'
  belongs_to :cancelled_by, class_name: 'User', optional: true

  has_many :interview_request_messages, dependent: :destroy

  STATUS_TRANSITIONS = {
    'requested' => %w[scheduling confirmed cancelled],
    'scheduling' => %w[confirmed cancelled],
    'confirmed' => %w[completed cancelled],
    'completed' => [],
    'cancelled' => []
  }.freeze

  enum status: {
    requested: 0,
    scheduling: 1,
    confirmed: 2,
    completed: 3,
    cancelled: 4
  }

  enum initiator_role: {
    teacher: 0,
    student: 1
  }, _prefix: true

  enum reason_category: {
    study_method: 0,
    study_plan: 1,
    academic_performance: 2,
    career: 3,
    school_life: 4,
    mental: 5,
    other: 6
  }

  validates :reason_detail, presence: true, length: { maximum: 2000 }
  validates :reason_category, presence: true, if: :initiator_role_student?
  validates :reason_category, absence: true, if: :initiator_role_teacher?

  validate :student_must_be_student
  validate :teacher_must_be_teacher
  validate :no_duplicate_active_request_for_pair
  validate :valid_status_transition

  scope :active, -> { where(status: %i[requested scheduling confirmed]) }

  def active?
    requested? || scheduling? || confirmed?
  end

  private

  def student_must_be_student
    return if student.blank? || student.student?

    errors.add(:student, 'は生徒である必要があります')
  end

  def teacher_must_be_teacher
    return if teacher.blank? || teacher.teacher?

    errors.add(:teacher, 'は教員である必要があります')
  end

  def no_duplicate_active_request_for_pair
    return if student_id.blank? || teacher_id.blank?
    return unless %w[requested scheduling confirmed].include?(status)

    duplicates = self.class.where(
      student_id: student_id, teacher_id: teacher_id, status: %i[requested scheduling confirmed]
    )
    duplicates = duplicates.where.not(id: id) if persisted?

    errors.add(:base, 'この生徒との進行中の面談が既に存在します') if duplicates.exists?
  end

  def valid_status_transition
    return unless persisted?
    return unless will_save_change_to_status?

    from = status_was
    to = status

    return if STATUS_TRANSITIONS[from].include?(to)

    errors.add(:status, "#{from} から #{to} へは変更できません")
  end
end
