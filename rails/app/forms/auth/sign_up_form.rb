# frozen_string_literal: true

module Auth
  class SignUpForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :email, :string
    attribute :name, :string
    attribute :name_kana, :string
    attribute :password, :string
    attribute :password_confirmation, :string
    attribute :user_role_name, :string
    attribute :school_name, :string

    validates :name, presence: true
    validates :name_kana, presence: true
    validates :user_role_name, presence: true
    validates :school_name, presence: true

    def to_attributes
      {
        email:,
        name:,
        name_kana:,
        password:,
        password_confirmation:
      }
    end
  end
end
