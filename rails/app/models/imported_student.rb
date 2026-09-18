class ImportedStudent < ApplicationRecord
  belongs_to :import_history
  belongs_to :user

  enum :action, {
    created: 0,
    updated: 1
  }, validate: true
end
