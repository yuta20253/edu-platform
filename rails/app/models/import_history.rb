# frozen_string_literal: true

# == Schema Information
#
# Table name: import_histories
#
#  id            :bigint           not null, primary key
#  user_id       :bigint           not null
#  unit_id       :bigint
#  file_name     :string(255)      not null
#  file_size     :bigint
#  content_type  :string(255)
#  status        :integer          default("pending"), not null
#  total_count   :integer          default(0), not null
#  success_count :integer          default(0), not null
#  error_count   :integer          default(0), not null
#  started_at    :datetime
#  finished_at   :datetime
#  deleted_at    :datetime
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  mode          :integer          default("append"), not null
#  import_type   :integer          default("question"), not null
#
class ImportHistory < ApplicationRecord
  belongs_to :user
  belongs_to :unit, optional: true
  has_many :import_errors, -> { order(:row_number) }, dependent: :destroy, inverse_of: :import_history

  has_one_attached :file

  validates :unit, presence: true, if: :question?

  scope :active, -> { where(deleted_at: nil) }

  enum status: {
    pending: 0,
    processing: 1,
    completed: 2,
    failed: 3
  }

  enum :mode, {
    append: 0,
    overwrite: 1
  }, validate: true

  enum :import_type, {
    question: 0,
    student: 1
  }, validate: true
end
