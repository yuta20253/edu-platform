# frozen_string_literal: true

# == Schema Information
#
# Table name: import_histories
#
#  id            :bigint           not null, primary key
#  user_id       :bigint           not null
#  unit_id       :bigint           not null
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
#
class ImportHistory < ApplicationRecord
  belongs_to :user
  belongs_to :unit
  has_many :import_errors, dependent: :destroy

  has_one_attached :file

  enum status: {
    pending: 0,
    processing: 1,
    completed: 2,
    failed: 3
  }
end
