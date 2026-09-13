# frozen_string_literal: true

module EmailValidatable
  extend ActiveSupport::Concern

  included do
    validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  end
end
