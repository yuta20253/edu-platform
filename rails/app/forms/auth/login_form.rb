# frozen_string_literal: true

module Auth
  class LoginForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations
    include EmailValidatable

    attribute :email, :string
    attribute :password, :string

    validates :password, presence: true

    def to_attributes
      {
        email:,
        password:
      }
    end
  end
end
