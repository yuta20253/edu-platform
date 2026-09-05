class AccountLinkAudit < ApplicationRecord
  belongs_to :user

  enum :result, {
    success: 'success',
    failed: 'failed'
  }
end
