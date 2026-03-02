# frozen_string_literal: true

module Auth
  class PasswordResetForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attr_accessor :reset_password_token, :password, :password_confirmation

    validates :reset_password_token, presence: true
    validates :password, presence: true
    validates :password_confirmation, presence: true
    validates :password, confirmation: true
  end
end
