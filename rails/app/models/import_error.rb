# frozen_string_literal: true

class ImportError < ApplicationRecord
  belongs_to :import_history
end
