# frozen_string_literal: true

module Auth
  class LoginForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :email, :string
    attribute :password, :string

    validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :password, presence: true

    def to_attributes
      {
        email:,
        password:
      }
    end
  end
end
