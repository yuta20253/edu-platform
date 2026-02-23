# frozen_string_literal: true

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
